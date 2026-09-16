package ca.bc.gov.pay.webhook;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import org.junit.jupiter.api.Test;

import java.security.GeneralSecurityException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Tests for WebhookReceiver.verifyToken().
 *
 * Run:
 *   mvn test
 */
class WebhookReceiverTest {

    private static final String SA_EMAIL = "pay-events-webhook-delivery@project.iam.gserviceaccount.com";

    @Test
    void validToken_returnsClaims() throws Exception {
        var payload = mock(GoogleIdToken.Payload.class);
        when(payload.get("email")).thenReturn(SA_EMAIL);

        var token = mock(GoogleIdToken.class);
        when(token.getPayload()).thenReturn(payload);

        var verifier = mock(GoogleIdTokenVerifier.class);
        when(verifier.verify(anyString())).thenReturn(token);

        var result = WebhookReceiver.verifyToken("valid.token", verifier);
        assertNotNull(result);
        assertEquals(SA_EMAIL, result.getPayload().get("email"));
    }

    @Test
    void structurallyInvalidToken_returnsNull() throws Exception {
        var verifier = mock(GoogleIdTokenVerifier.class);
        when(verifier.verify(anyString())).thenReturn(null);

        assertNull(WebhookReceiver.verifyToken("not.a.jwt", verifier));
    }

    @Test
    void expiredToken_throws() throws Exception {
        var verifier = mock(GoogleIdTokenVerifier.class);
        when(verifier.verify(anyString())).thenThrow(new GeneralSecurityException("Token expired"));

        var ex = assertThrows(GeneralSecurityException.class,
                () -> WebhookReceiver.verifyToken("expired.token", verifier));
        assertTrue(ex.getMessage().contains("Token expired"));
    }

    @Test
    void wrongAudience_throws() throws Exception {
        var verifier = mock(GoogleIdTokenVerifier.class);
        when(verifier.verify(anyString())).thenThrow(new GeneralSecurityException("Wrong audience"));

        assertThrows(GeneralSecurityException.class,
                () -> WebhookReceiver.verifyToken("wrong.aud.token", verifier));
    }

    @Test
    void tamperedSignature_throws() throws Exception {
        var verifier = mock(GoogleIdTokenVerifier.class);
        when(verifier.verify(anyString())).thenThrow(new GeneralSecurityException("Invalid signature"));

        assertThrows(GeneralSecurityException.class,
                () -> WebhookReceiver.verifyToken("tampered.token", verifier));
    }
}
