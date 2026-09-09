"""
Tests for verify_jwt().

Run:
    pip install -r requirements.txt
    python -m pytest test_receiver.py  OR  python -m unittest test_receiver
"""

import os
import unittest
from unittest.mock import patch

# Must be set before importing the module.
os.environ.setdefault("AUDIENCE", "https://example.com/pay-events")
os.environ.setdefault("PUBSUB_SA_EMAIL", "pay-events-webhook-delivery@project.iam.gserviceaccount.com")

import receiver  # noqa: E402


SA_EMAIL = "pay-events-webhook-delivery@project.iam.gserviceaccount.com"

VALID_CLAIMS = {
    "iss": "https://accounts.google.com",
    "aud": "https://example.com/pay-events",
    "email": SA_EMAIL,
    "sub": "123456789",
}


class TestVerifyJwt(unittest.TestCase):
    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_valid_token_returns_claims(self, mock_verify):
        mock_verify.return_value = VALID_CLAIMS
        claims = receiver.verify_jwt("valid.token.here")
        self.assertEqual(claims["email"], SA_EMAIL)
        mock_verify.assert_called_once_with("valid.token.here", receiver._http_request, audience=receiver.AUDIENCE)

    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_expired_token_raises(self, mock_verify):
        mock_verify.side_effect = ValueError("Token expired")
        with self.assertRaises(ValueError):
            receiver.verify_jwt("expired.token")

    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_wrong_audience_raises(self, mock_verify):
        mock_verify.side_effect = ValueError("Wrong audience")
        with self.assertRaises(ValueError):
            receiver.verify_jwt("wrong.audience.token")

    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_tampered_signature_raises(self, mock_verify):
        mock_verify.side_effect = ValueError("Invalid signature")
        with self.assertRaises(ValueError):
            receiver.verify_jwt("tampered.token")

    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_wrong_issuer_raises(self, mock_verify):
        mock_verify.side_effect = ValueError("Wrong issuer")
        with self.assertRaises(ValueError):
            receiver.verify_jwt("wrong.issuer.token")


if __name__ == "__main__":
    unittest.main()
