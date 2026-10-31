"""
WordBloom — test_agent_registry.py
===================================
Unit tests for Google Cloud Agent Registry & Least-Privilege Agent Identity.
"""

import unittest
from wordbloom_agent.agent_identity import (
    get_agent_card,
    get_agent_identity_status,
    verify_least_privilege_roles,
    LEAST_PRIVILEGE_REQUIRED_ROLES,
    FORBIDDEN_ELEVATED_ROLES,
    SUB_AGENTS_MANIFEST,
)
from fastapi.testclient import TestClient
from main import app


class TestAgentRegistryAndIdentity(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_01_agent_card_schema(self):
        """Agent Card must adhere to A2A schema with required top-level metadata."""
        card = get_agent_card()
        self.assertEqual(card["name"], "wordbloom")
        self.assertIn("WordBloom", card["display_name"])
        self.assertEqual(card["version"], "1.0.0")
        self.assertEqual(card["protocol_version"], "0.2.0")
        self.assertIn("endpoints", card)
        self.assertIn("capabilities", card)
        self.assertIn("governance", card)
        self.assertIn("identity", card)
        self.assertIn("sub_agents", card)

    def test_02_sub_agents_manifest(self):
        """All 6 core agents must be registered with plain-English roles."""
        self.assertEqual(len(SUB_AGENTS_MANIFEST), 6)
        names = {agent["name"] for agent in SUB_AGENTS_MANIFEST}
        expected = {
            "ProfileAgent",
            "WordSelectorAgent",
            "EvaluatorAgent",
            "AdapterAgent",
            "EncouragementAgent",
            "ReportAgent",
        }
        self.assertEqual(names, expected)

    def test_03_least_privilege_compliance_success(self):
        """Verify compliant IAM roles pass verification."""
        result = verify_least_privilege_roles(LEAST_PRIVILEGE_REQUIRED_ROLES)
        self.assertTrue(result["compliant"])
        self.assertEqual(len(result["missing_required_roles"]), 0)
        self.assertEqual(len(result["forbidden_violations"]), 0)

    def test_04_forbidden_role_violation(self):
        """Verify granting forbidden roles triggers a non-compliant flag."""
        compromised_roles = LEAST_PRIVILEGE_REQUIRED_ROLES + ["roles/owner"]
        result = verify_least_privilege_roles(compromised_roles)
        self.assertFalse(result["compliant"])
        self.assertIn("roles/owner", result["forbidden_violations"])

    def test_05_missing_required_role(self):
        """Verify omitting a required role fails compliance check."""
        incomplete_roles = ["roles/aiplatform.user"]
        result = verify_least_privilege_roles(incomplete_roles)
        self.assertFalse(result["compliant"])
        self.assertIn("roles/modelarmor.user", result["missing_required_roles"])
        self.assertIn("roles/dlp.user", result["missing_required_roles"])

    def test_06_agent_identity_status(self):
        """Agent identity status must provide active configuration and enforcement flag."""
        status = get_agent_identity_status()
        self.assertEqual(status["status"], "active")
        self.assertEqual(status["agent_name"], "wordbloom")
        self.assertTrue(status["least_privilege_policy"]["enforced"])
        self.assertTrue(status["least_privilege_policy"]["compliance"]["compliant"])

    def test_07_fastapi_agent_card_endpoints(self):
        """FastAPI must serve Agent Card at standard well-known locations."""
        # Root .well-known
        r1 = self.client.get("/.well-known/agent-card.json")
        self.assertEqual(r1.status_code, 200)
        data1 = r1.json()
        self.assertEqual(data1["name"], "wordbloom")

        # A2A namespace
        r2 = self.client.get("/a2a/wordbloom/.well-known/agent-card.json")
        self.assertEqual(r2.status_code, 200)
        data2 = r2.json()
        self.assertEqual(data2["name"], "wordbloom")

        # Identity endpoint
        r3 = self.client.get("/agent/identity")
        self.assertEqual(r3.status_code, 200)
        data3 = r3.json()
        self.assertEqual(data3["agent_name"], "wordbloom")
        self.assertTrue(data3["least_privilege_policy"]["enforced"])

        # Health endpoint updated
        r4 = self.client.get("/")
        self.assertEqual(r4.status_code, 200)
        data4 = r4.json()
        self.assertIn("agent_registry", data4)
        self.assertEqual(data4["agent_registry"]["status"], "registered")


if __name__ == "__main__":
    unittest.main()
