import { describe, it, expect } from 'vitest';

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await fetch('http://localhost:3000/api/health');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ status: 'ok' });
  });
});
