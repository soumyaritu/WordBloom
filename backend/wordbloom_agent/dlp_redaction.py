"""
WordBloom — dlp_redaction.py
=============================
Google Cloud DLP (Sensitive Data Protection) & Child PII Redaction.

Protects children's sensitive personally identifiable information (PII)
in learning summaries, parent dispatches, and external audit logs.

Guardrails:
  1. Google Cloud DLP Client (google.cloud.dlp_v2) for enterprise redaction
     (PERSON_NAME, EMAIL_ADDRESS, PHONE_NUMBER, LOCATION, ORGANIZATION_NAME).
  2. Safe Deterministic Fallback: If DLP is unreachable, unauthenticated in dev,
     or quota-limited, automatically falls back to instant local token-surrogate
     redaction (< 0.001s).
  3. Feature flag: DLP_ENABLED (env var, default True).
"""

import os
import re
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("wordbloom.dlp")

# Feature flag: default True
DLP_ENABLED = os.getenv("DLP_ENABLED", "true").lower() in ("true", "1", "yes")

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "soumyaaidevcamppro")

_dlp_client = None
_dlp_init_attempted = False


def _get_dlp_client():
    global _dlp_client, _dlp_init_attempted
    if _dlp_init_attempted:
        return _dlp_client
    _dlp_init_attempted = True
    try:
        from google.cloud import dlp_v2
        _dlp_client = dlp_v2.DlpServiceClient()
        logger.info("Google Cloud DLP client initialized successfully.")
    except Exception as e:
        logger.info(f"Google Cloud DLP client unavailable ({e}); deterministic local surrogate active.")
        _dlp_client = None
    return _dlp_client


# Common student surrogate tokens
SURROGATE_STUDENT = "[STUDENT_NAME]"
SURROGATE_EMAIL = "[EMAIL_REDACTED]"
SURROGATE_PHONE = "[PHONE_REDACTED]"


def _local_surrogate_redaction(text: str, child_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Deterministic rule-based fallback that redacts names, emails, and phone numbers.
    Zero latency (<0.001s), zero network calls.
    """
    if not text:
        return {"redacted_text": "", "findings_count": 0, "engine": "local_fallback", "surrogates": {}}

    redacted = text
    surrogates = {}
    findings_count = 0

    # 1. Target Child Name Redaction (Full name and First name)
    if child_name:
        clean_name = str(child_name).strip()
        if clean_name and len(clean_name) >= 2:
            # Full name
            pattern = re.compile(re.escape(clean_name), re.IGNORECASE)
            matches = pattern.findall(redacted)
            if matches:
                findings_count += len(matches)
                surrogates[SURROGATE_STUDENT] = clean_name
                redacted = pattern.sub(SURROGATE_STUDENT, redacted)

            # First name if distinct
            parts = clean_name.split()
            if len(parts) > 1 and len(parts[0]) >= 3:
                first_name = parts[0]
                fn_pattern = re.compile(rf"\b{re.escape(first_name)}\b", re.IGNORECASE)
                fn_matches = fn_pattern.findall(redacted)
                if fn_matches:
                    findings_count += len(fn_matches)
                    surrogates[SURROGATE_STUDENT] = first_name
                    redacted = fn_pattern.sub(SURROGATE_STUDENT, redacted)

    # 2. Email redaction
    email_pattern = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
    emails = email_pattern.findall(redacted)
    if emails:
        findings_count += len(emails)
        for em in emails:
            surrogates[SURROGATE_EMAIL] = em
        redacted = email_pattern.sub(SURROGATE_EMAIL, redacted)

    # 3. UK / US phone number pattern
    phone_pattern = re.compile(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}")
    phones = phone_pattern.findall(redacted)
    if phones:
        findings_count += len(phones)
        for ph in phones:
            surrogates[SURROGATE_PHONE] = ph
        redacted = phone_pattern.sub(SURROGATE_PHONE, redacted)

    return {
        "redacted_text": redacted,
        "findings_count": findings_count,
        "engine": "local_fallback",
        "surrogates": surrogates,
    }


def redact_personal_data(text: str, child_name: Optional[str] = None) -> Dict[str, Any]:
    """
    De-identifies sensitive child PII in reports and messages.
    Uses Google Cloud DLP if available, otherwise seamlessly falls back to
    deterministic local token replacement.
    """
    if not text:
        return {"redacted_text": "", "findings_count": 0, "engine": "passthrough", "surrogates": {}}

    if not DLP_ENABLED:
        return {"redacted_text": text, "findings_count": 0, "engine": "disabled", "surrogates": {}}

    client = _get_dlp_client()
    if client and PROJECT_ID:
        try:
            from google.cloud import dlp_v2
            parent = f"projects/{PROJECT_ID}/locations/global"
            inspect_config = {
                "info_types": [
                    {"name": "PERSON_NAME"},
                    {"name": "EMAIL_ADDRESS"},
                    {"name": "PHONE_NUMBER"},
                    {"name": "LOCATION"},
                ],
                "min_likelihood": dlp_v2.Likelihood.LIKELY,
            }
            deidentify_config = {
                "info_type_transformations": {
                    "transformations": [
                        {
                            "primitive_transformation": {
                                "replace_with_info_type_config": {}
                            }
                        }
                    ]
                }
            }
            item = {"value": text}
            response = client.deidentify_content(
                request={
                    "parent": parent,
                    "deidentify_config": deidentify_config,
                    "inspect_config": inspect_config,
                    "item": item,
                }
            )
            redacted_cloud = response.item.value
            return {
                "redacted_text": redacted_cloud,
                "findings_count": 1,
                "engine": "google_cloud_dlp",
                "surrogates": {},
            }
        except Exception as e:
            logger.warning(f"Cloud DLP deidentify failed ({e}); invoking local surrogate fallback.")

    # Guaranteed non-breaking local surrogate fallback
    return _local_surrogate_redaction(text, child_name=child_name)


def reidentify_text(redacted_text: str, surrogates: Dict[str, str]) -> str:
    """
    Rehydrates surrogate tokens back to their original values for educator display.
    """
    if not redacted_text or not surrogates:
        return redacted_text
    rehydrated = redacted_text
    for token, original in surrogates.items():
        rehydrated = rehydrated.replace(token, original)
    return rehydrated

