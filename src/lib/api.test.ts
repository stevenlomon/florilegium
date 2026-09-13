import { setBoundedCache, fetchWithRetry } from './api';

// Hijack the global fetch API so we can control network responses
// It's really cool to see what we learned in our DevOps course actually being used!
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('fetchWithRetry', () => {
  // Clear the mock's memory before every single test
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('returns immediately on a succesful request', async () => {
    // Force fetch to return a 200 OK immediately
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

    let URL = 'https://fake-test-library.org';
    const res = await fetchWithRetry(URL);

    expect(mockFetch).toHaveBeenCalledTimes(1); // No retries should have been taking place
    expect(res.ok).toBe(true);

    // All our fetches have two arguments; URL and an Object with headers, `AbortSignal` etc. 
    // `expect.any(Object)` signals "don't worry about the second options parameter containing the internal timeout signal."
    expect(mockFetch).toHaveBeenCalledWith(URL, expect.any(Object)); 
  });
});

describe('setBoundedCache (LRU)', () => {
  let cache: Map<string, string>;

  beforeEach(() => {
    cache = new Map;
  });

  // setBoundedCache tests to be added here
  
})