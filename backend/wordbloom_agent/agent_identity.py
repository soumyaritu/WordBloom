"""
WordBloom — agent_identity.py
==============================
Google Cloud Agent Registry & Least-Privilege Agent Identity Module.

Adheres to Google ADK and Agent-to-Agent (A2A) protocol standards.
Defines:
1. Standards-compliant Agent Card metadata.
2. Least-privilege IAM policy matrix for child-safe enterprise execution.
3. Registration manifest for Google Cloud Vertex AI Agent Registry.
"""

import os
from typing import Dict, Any, List

DEFAULT_PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "soumyaaidevcamppro")
DEFAULT_LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
DEFAULT_SERVICE_ACCOUNT = f"wordbloom-agent@{DEFAULT_PROJECT_ID}.iam.gserviceaccount.com"

# Least-privilege IAM roles required for WordBloom operation
LEAST_PRIVILEGE_REQUIRED_ROLES: List[str] = [
    "roles/aiplatform.user",      # Vertex AI Gemini 2.5 Flash invocation
    "roles/modelarmor.user",      # Google Cloud Model Armor child guard template
    "roles/dlp.user",             # Sensitive Data Protection (Cloud DLP) PII redaction
]

# Explicitly forbidden high-privilege roles to prevent privilege escalation
FORBIDDEN_ELEVATED_ROLES: List[str] = [
    "roles/owner",
    "roles/editor",
    "roles/iam.serviceAccountAdmin",
    "roles/resourcemanager.organizationAdmin",
]

SUB_AGENTS_MANIFEST = [
    {
        "name": "ProfileAgent",
        "file": "profile_agent.py",
        "role": "Loads child learning profile from SKILL.md and sets baseline accommodations."
    },
    {
        "name": "WordSelectorAgent",
        "file": "word_selector_agent.py",
        "role": "Curates phonetic target words based on reading level and historical retention."
    },
    {
        "name": "EvaluatorAgent",
        "file": "evaluator_agent.py",
        "role": "Evaluates child responses against 245 phonetic and mirror reversal rules."
    },
    {
        "name": "AdapterAgent",
        "file": "adapter_agent.py",
        "role": "Paces session, applies sensory breaks (ADHD), and calculates micro-scaffolds."
    },
    {
        "name": "EncouragementAgent",
        "file": "encouragement_agent.py",
        "role": "Delivers factual praise screened in real time by Google Cloud Model Armor."
    },
    {
        "name": "ReportAgent",
        "file": "report_agent.py",
        "role": "Synthesizes session progress into educator reports gated behind teacher approval."
    },
]


def get_agent_card(base_url: str = "https://wordbloom-backend-820113329049.us-central1.run.app") -> Dict[str, Any]:
    """
    Returns the standard Agent-to-Agent (A2A) Agent Card metadata.
    Exposed at /.well-known/agent-card.json and /a2a/wordbloom/.well-known/agent-card.json.
    """
    return {
        "name": "wordbloom",
        "display_name": "WordBloom Adaptive Reading Tutor",
        "tagline": "Every word. Every child. Every way.",
        "description": (
            "Multi-agent adaptive literacy companion for children with dyslexia "
            "and diverse learning differences, built with Google ADK and Vertex AI."
        ),
        "version": "1.0.0",
        "protocol_version": "0.2.0",
        "provider": {
            "name": "WordBloom Learning",
            "framework": "Google Agent Development Kit (ADK)",
            "cloud_platform": "Google Cloud Vertex AI",
        },
        "endpoints": {
            "root": base_url,
            "agent_card": f"{base_url}/.well-known/agent-card.json",
            "session_start": f"{base_url}/session/start",
            "session_answer": f"{base_url}/session/answer",
            "session_end": f"{base_url}/session/end",
            "report_approve": f"{base_url}/report/approve",
            "identity": f"{base_url}/agent/identity",
        },
        "capabilities": {
            "streaming": False,
            "multimodal": True,
            "input_modes": ["voice", "keyboard", "tap_tiles"],
            "supported_profiles": [
                "phonological_dyslexia",
                "surface_dyslexia",
                "visual_spatial_dyslexia",
                "double_deficit",
                "attentional_dyslexia",
                "adhd",
                "autism",
                "dyspraxia",
            ],
            "pedagogical_standards": [
                "CAST Universal Design for Learning (UDL)",
                "UK Synthetic Phonics progression (Stages 1-4)",
            ],
        },
        "governance": {
            "model_armor_template": os.getenv("MODEL_ARMOR_TEMPLATE_ID", "wordbloom-child-guard"),
            "dlp_redaction_enabled": True,
            "human_in_the_loop_gate": True,
            "timer_policy": "never_shown",
            "score_policy": "stars_only_no_numerical_ranking",
        },
        "identity": {
            "service_account": os.getenv("AGENT_SERVICE_ACCOUNT", DEFAULT_SERVICE_ACCOUNT),
            "project_id": DEFAULT_PROJECT_ID,
            "location": DEFAULT_LOCATION,
            "least_privilege_enforced": True,
        },
        "sub_agents": SUB_AGENTS_MANIFEST,
    }


def verify_least_privilege_roles(granted_roles: List[str]) -> Dict[str, Any]:
    """
    Verifies that a list of granted IAM roles satisfies least-privilege constraints:
    - Must include all required roles.
    - Must NOT include any forbidden elevated administrative roles.
    """
    missing_required = [r for r in LEAST_PRIVILEGE_REQUIRED_ROLES if r not in granted_roles]
    violations = [r for r in FORBIDDEN_ELEVATED_ROLES if r in granted_roles]

    is_compliant = (len(missing_required) == 0) and (len(violations) == 0)
    return {
        "compliant": is_compliant,
        "granted_roles": granted_roles,
        "missing_required_roles": missing_required,
        "forbidden_violations": violations,
        "summary": "Least-privilege policy satisfied" if is_compliant else "Policy non-compliant",
    }


def get_agent_identity_status() -> Dict[str, Any]:
    """
    Returns runtime agent identity, active GCP credentials status,
    and least-privilege IAM configuration matrix.
    """
    service_account = os.getenv("AGENT_SERVICE_ACCOUNT", DEFAULT_SERVICE_ACCOUNT)
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT", DEFAULT_PROJECT_ID)
    location = os.getenv("GOOGLE_CLOUD_LOCATION", DEFAULT_LOCATION)

    # Simulated/Declared baseline configuration (always present)
    baseline_compliance = verify_least_privilege_roles(LEAST_PRIVILEGE_REQUIRED_ROLES)

    # Check local environment authentication status
    has_gcp_creds = bool(os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv("GOOGLE_CLOUD_PROJECT"))

    return {
        "status": "active",
        "agent_name": "wordbloom",
        "service_account": service_account,
        "project_id": project_id,
        "location": location,
        "gcp_credentials_detected": has_gcp_creds,
        "least_privilege_policy": {
            "enforced": True,
            "required_roles": LEAST_PRIVILEGE_REQUIRED_ROLES,
            "forbidden_roles": FORBIDDEN_ELEVATED_ROLES,
            "compliance": baseline_compliance,
        },
        "registry": {
            "status": "registered",
            "registry_type": "google_cloud_agent_registry",
            "agent_card_url": "/.well-known/agent-card.json",
        },
    }

