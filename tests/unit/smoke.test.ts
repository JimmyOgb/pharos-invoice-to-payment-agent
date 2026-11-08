import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Smoke test', () => {
  it('runs successfully with strip-types', () => {
    assert.strictEqual(1 + 1, 2);
  });
});
