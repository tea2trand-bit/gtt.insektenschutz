import assert from 'node:assert/strict';
import test from 'node:test';

import validateFormSubmission, {
  validateSubmission,
} from '../netlify/edge-functions/validate-form-submission.js';

function request(body) {
  return new Request('https://gtt-insektenschutz.ch/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
}

test('kontakt requires full name, phone and email', () => {
  const result = validateSubmission({
    formName: 'kontakt',
    name: '',
    telefon: '',
    email: '',
  });

  assert.equal(result.protectedForm, true);
  assert.deepEqual(Object.keys(result.errors).sort(), ['email', 'name', 'telefon']);
});

test('a one-word name is rejected', () => {
  const result = validateSubmission({
    formName: 'kontakt',
    name: 'Monika',
    telefon: '+41 78 123 45 67',
    email: 'monika@example.ch',
  });

  assert.deepEqual(Object.keys(result.errors), ['name']);
});

test('a normal Swiss contact is accepted', () => {
  const result = validateSubmission({
    formName: 'kontakt',
    name: 'Monika Thürlemann',
    telefon: '+41 (0)78 684 36 63',
    email: 'monika@example.ch',
  });

  assert.deepEqual(result.errors, {});
});

test('b2b email remains optional while name and phone stay required', () => {
  const result = validateSubmission({
    formName: 'b2b-anfrage',
    name: 'Hans Müller',
    telefon: '071 123 45 67',
    email: '',
  });

  assert.deepEqual(result.errors, {});
});

test('direct incomplete POST is rejected before Netlify Forms', async () => {
  const response = await validateFormSubmission(
    request({
      'form-name': 'kontakt',
      email: 'bot@example.com',
      nachricht: 'Bitte kontaktieren Sie mich.',
    }),
  );

  assert.equal(response.status, 422);
  const payload = await response.json();
  assert.deepEqual(payload.fields.sort(), ['name', 'telefon']);
});

test('valid POST continues to Netlify Forms', async () => {
  const response = await validateFormSubmission(
    request({
      'form-name': 'kontakt',
      name: 'Anna Meier',
      telefon: '+41 79 123 45 67',
      email: 'anna@example.ch',
    }),
  );

  assert.equal(response, undefined);
});

test('honeypot submission is silently stopped', async () => {
  const response = await validateFormSubmission(
    request({
      'form-name': 'kontakt',
      'bot-field': 'spam',
      name: 'Fake Person',
      telefon: '+41 79 123 45 67',
      email: 'fake@example.com',
    }),
  );

  assert.equal(response.status, 204);
});
