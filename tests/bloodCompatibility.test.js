// tests/bloodCompatibility.test.js
const test = require('node:test');
const assert = require('node:assert');
const { isCompatible } = require('../utils/bloodCompatibility');

test('Blood Compatibility Matrix Tests', async (t) => {
  await t.test('O- should donate to all groups (Universal Donor)', () => {
    const recipients = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
    recipients.forEach(r => {
      assert.strictEqual(isCompatible('O-', r), true, `O- should donate to ${r}`);
    });
  });

  await t.test('AB+ should receive from all groups (Universal Recipient)', () => {
    const donors = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
    donors.forEach(d => {
      assert.strictEqual(isCompatible(d, 'AB+'), true, `AB+ should receive from ${d}`);
    });
  });

  await t.test('Same blood groups should be compatible', () => {
    const groups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
    groups.forEach(g => {
      assert.strictEqual(isCompatible(g, g), true, `${g} should be compatible with ${g}`);
    });
  });

  await t.test('Incompatible checks', () => {
    assert.strictEqual(isCompatible('A+', 'O-'), false, 'A+ cannot donate to O-');
    assert.strictEqual(isCompatible('B+', 'A+'), false, 'B+ cannot donate to A+');
    assert.strictEqual(isCompatible('AB-', 'O+'), false, 'AB- cannot donate to O+');
    assert.strictEqual(isCompatible('O+', 'O-'), false, 'O+ cannot donate to O-');
  });
});
