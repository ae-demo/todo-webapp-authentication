// Verifies the gateway assertion interceptor wired in gateway_assertion.bal —
// copied verbatim from the `ballerina` skill — against a throwaway RSA
// keypair. Nothing here talks to a real gateway or IdP: GATEWAY_ASSERTION_*
// is set (see the run command) from a self-signed certificate this suite
// mints locally, and each test signs its own JWT with the matching private
// key.
//
// No real Postgres is available in this environment either. `tests/Config.toml`
// sets `ensureSchemaOnStart = false` and a lazy `dbPoolInitFailTimeout` so
// module init succeeds without one; these tests only assert on the
// interceptor's 401/pass-through behaviour, never on persisted data.

import ballerina/http;
import ballerina/jwt;
import ballerina/test;

const string VALID_KEY_PATH = "tests/resources/valid-key.pem";
const string OTHER_KEY_PATH = "tests/resources/other-key.pem";

http:Client testClient = check new ("http://localhost:9090");

function issueAssertion(string keyFile, string subject, string scope) returns string|error {
    jwt:IssuerConfig issuerConfig = {
        issuer: "test-gateway",
        username: subject,
        expTime: 300,
        customClaims: {"scope": scope},
        signatureConfig: {
            config: {keyFile: keyFile, keyPassword: ""}
        }
    };
    return jwt:issue(issuerConfig);
}

// A valid, gateway-shaped assertion is verified and the request reaches the
// resource handler — the interceptor never answers 401 for it. This
// environment has no real todo-db, so the handler itself may still fail
// persisting/reading (e.g. 500); what this test pins down is that the
// REFUSAL never happens, which is the interceptor's whole job.
@test:Config {}
function testValidAssertionAccepted() returns error? {
    string token = check issueAssertion(VALID_KEY_PATH, "test-user-1", "todos:read todos:write");
    http:Response response = check testClient->get("/me/todos", {"x-jwt-assertion": token});
    test:assertNotEquals(response.statusCode, 401);
}

// An assertion signed by a DIFFERENT private key than the one behind
// GATEWAY_ASSERTION_CERTIFICATE fails signature verification — 401, not a
// silently-anonymous request.
@test:Config {}
function testWrongKeySignedAssertionRejected() returns error? {
    string token = check issueAssertion(OTHER_KEY_PATH, "test-user-1", "todos:read");
    http:Response response = check testClient->get("/me/todos", {"x-jwt-assertion": token});
    test:assertEquals(response.statusCode, 401);
}

// A payload edited after signing breaks the signature over the JWT's
// signing input — also 401, never downgraded to anonymous.
@test:Config {}
function testTamperedAssertionRejected() returns error? {
    string token = check issueAssertion(VALID_KEY_PATH, "test-user-1", "todos:read");
    string[] segments = re `\.`.split(token);
    test:assertEquals(segments.length(), 3);
    string payloadSegment = segments[1];
    string flipped = payloadSegment.startsWith("e") ? "f" : "e";
    string tamperedPayload = flipped + payloadSegment.substring(1, payloadSegment.length());
    string tampered = segments[0] + "." + tamperedPayload + "." + segments[2];
    http:Response response = check testClient->get("/me/todos", {"x-jwt-assertion": tampered});
    test:assertEquals(response.statusCode, 401);
}

// This contract has no `security: []` operation — every operation under
// /me/todos requires a signed-in caller — so the "no assertion" case is a
// request with no header at all, which the handler (not the interceptor)
// answers 401 for, having resolved no caller from the context.
@test:Config {}
function testNoAssertionRejected() returns error? {
    http:Response response = check testClient->get("/me/todos");
    test:assertEquals(response.statusCode, 401);
}
