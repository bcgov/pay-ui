package ca.bc.gov.pay.webhook;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.logging.Logger;

/**
 * BC Registries – Partner payment-event webhook receiver (Java).
 *
 * Uses the stdlib com.sun.net.httpserver — no web framework required.
 * JWT verification uses google-api-client against Google's OIDC endpoint.
 *
 * Environment variables:
 *   AUDIENCE        Audience the JWT must carry — set to this server's public URL.
 *   PUBSUB_SA_EMAIL Service account email Pub/Sub signs tokens as.
 *
 * Run:
 *   mvn package
 *   AUDIENCE=https://... java -jar target/payment-event-receiver-1.0.0.jar
 */
public class WebhookReceiver {

    private static final Logger log = Logger.getLogger(WebhookReceiver.class.getName());

    private static final String AUDIENCE = System.getenv("AUDIENCE");
    private static final String EXPECTED_SA_EMAIL = System.getenv("PUBSUB_SA_EMAIL");

    /**
     * Verify a Pub/Sub OIDC JWT and return the decoded token.
     *
     * GCP Pub/Sub signs every push request with an OIDC token issued for the
     * configured delivery service account. This method:
     *   1. Fetches Google's public keys (cached internally by the verifier).
     *   2. Verifies the RS256 signature.
     *   3. Confirms the audience matches the verifier's configured audience (this server's URL).
     *   4. Confirms the token has not expired.
     *
     * Returns null if the token is structurally invalid (not a JWT).
     * Throws Exception if the signature, audience, or expiry checks fail.
     * The caller should treat both null and any exception as an invalid token.
     *
     * @param rawToken  Raw JWT string from the Authorization: Bearer header.
     * @param verifier  A GoogleIdTokenVerifier configured with this server's audience.
     */
    static GoogleIdToken verifyToken(String rawToken, GoogleIdTokenVerifier verifier) throws Exception {
        return verifier.verify(rawToken);
    }

    public static void main(String[] args) throws Exception {
        if (AUDIENCE == null || AUDIENCE.isBlank()) {
            throw new IllegalStateException("AUDIENCE environment variable is required");
        }
        if (EXPECTED_SA_EMAIL == null || EXPECTED_SA_EMAIL.isBlank()) {
            throw new IllegalStateException("PUBSUB_SA_EMAIL environment variable is required");
        }

        var verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(AUDIENCE))
                .build();

        var server = HttpServer.create(new InetSocketAddress(8090), 0);
        server.createContext("/pay-events", exchange -> handle(exchange, verifier));
        server.start();
        log.info("listening on :8090");
    }

    private static void handle(HttpExchange exchange, GoogleIdTokenVerifier verifier) throws IOException {
        if (!"POST".equals(exchange.getRequestMethod())) {
            send(exchange, 405, null);
            return;
        }

        String auth = exchange.getRequestHeaders().getFirst("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            send(exchange, 401, error("missing bearer token"));
            return;
        }

        GoogleIdToken token;
        try {
            token = verifyToken(auth.substring(7), verifier);
        } catch (Exception e) {
            log.warning("JWT verification failed: " + e.getMessage());
            send(exchange, 401, error("invalid token"));
            return;
        }

        if (token == null) {
            send(exchange, 401, error("invalid token"));
            return;
        }

        String email = (String) token.getPayload().get("email");
        if (!EXPECTED_SA_EMAIL.equals(email)) {
            log.warning("unexpected caller: " + email);
            send(exchange, 403, error("unexpected service account"));
            return;
        }

        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        String messageId = firstHeader(exchange, "X-Goog-Message-Id");
        String publishTime = firstHeader(exchange, "X-Goog-Publish-Time");

        log.info(String.format("event  message_id=%s  publish_time=%s%n%s", messageId, publishTime, body));

        send(exchange, 204, null);
    }

    private static void send(HttpExchange exchange, int status, String body) throws IOException {
        if (body != null) {
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, bytes.length);
            exchange.getResponseBody().write(bytes);
        } else {
            exchange.sendResponseHeaders(status, -1);
        }
        exchange.close();
    }

    private static String error(String message) {
        return "{\"error\":\"" + message + "\"}";
    }

    private static String firstHeader(HttpExchange exchange, String name) {
        var values = exchange.getRequestHeaders().get(name);
        return (values != null && !values.isEmpty()) ? values.get(0) : "-";
    }
}
