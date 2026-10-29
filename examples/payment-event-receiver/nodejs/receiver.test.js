'use strict';
/**
 * Tests for verifyJwt().
 *
 * Run:
 *   node --test receiver.test.js
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');

// Must be set before requiring the module.
process.env.AUDIENCE = 'https://example.com/pay-events';
process.env.PUBSUB_SA_EMAIL = 'pay-events-webhook-delivery@project.iam.gserviceaccount.com';

const { verifyJwt } = require('./receiver');

const SA_EMAIL = 'pay-events-webhook-delivery@project.iam.gserviceaccount.com';

const VALID_PAYLOAD = {
    iss: 'https://accounts.google.com',
    aud: 'https://example.com/pay-events',
    email: SA_EMAIL,
    sub: '123456789',
};

// Builds a mock OAuth2Client whose verifyIdToken returns the given payload.
function mockClient(payload) {
    return {
        verifyIdToken: async () => ({ getPayload: () => payload }),
    };
}

// Builds a mock OAuth2Client whose verifyIdToken throws with the given message.
function failingClient(message) {
    return {
        verifyIdToken: async () => { throw new Error(message); },
    };
}

test('valid token returns claims', async () => {
    const claims = await verifyJwt('valid.token', mockClient(VALID_PAYLOAD));
    assert.equal(claims.email, SA_EMAIL);
    assert.equal(claims.aud, 'https://example.com/pay-events');
});

test('expired token throws', async () => {
    await assert.rejects(
        () => verifyJwt('expired.token', failingClient('Token expired')),
        /Token expired/,
    );
});

test('wrong audience throws', async () => {
    await assert.rejects(
        () => verifyJwt('wrong.aud.token', failingClient('Wrong audience')),
        /Wrong audience/,
    );
});

test('tampered signature throws', async () => {
    await assert.rejects(
        () => verifyJwt('tampered.token', failingClient('Invalid signature')),
        /Invalid signature/,
    );
});

test('wrong issuer throws', async () => {
    await assert.rejects(
        () => verifyJwt('bad.iss.token', failingClient('Wrong issuer')),
        /Wrong issuer/,
    );
});
