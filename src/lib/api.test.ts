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
    
    // All our fetches have two arguments; URL and an Object with headers, `AbortSignal` etc. 
    // `expect.any(Object)` signals "don't worry about the second options parameter containing the internal timeout signal."
    expect(mockFetch).toHaveBeenCalledWith(URL, expect.any(Object)); 

    expect(res.ok).toBe(true);
  });

  test('retries on a complete network drop (temporary hiccup) and recovers', async () => {
    // When mock requests are chained like these, they are queued FIFO. So order matters!
    mockFetch.mockRejectedValueOnce(new Error('Network offline'));
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

    // Filling out the optional parameters in fetchWithRetry now: 
    // * empty init object
    // * 1 retry
    // * 1 delay ms so the retry fires instantly without slowing down the test runner
    let URL = 'https://fake-test-library.org';
    const res = await fetchWithRetry(URL, {}, 1, 1);

    expect(mockFetch).toHaveBeenCalledTimes(2); // Two requests expected now..
    expect(mockFetch).toHaveBeenCalledWith(URL, expect.any(Object)); 

    expect(res.ok).toBe(true); // ..but all in all, the request is expected to have succeeded!
  });

  test('returns the failed response if all 5xx retries are exhausted', async () => {
    // Will be applied to both requests
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    let URL = 'https://fake-test-library.org';
    const res = await fetchWithRetry(URL, {}, 1, 1);

    expect(mockFetch).toHaveBeenCalledTimes(2); // Two requests...
    expect(mockFetch).toHaveBeenCalledWith(URL, expect.any(Object)); 

    // .. but all in all, a failed request with 500 as the status code
    expect(res.ok).toBe(false);
    expect(res.status).toBe(500);
  });

  // We distinguish between a resolved response with a 500 status code and a network exception (a rejected promise)
  test('an error is thrown if network exceptions persist across all retries', async () => {
    // Persistently rejects (e.g. AbortSignal timeout or dropped socket)
    mockFetch.mockRejectedValue(new Error('Connection aborted'));

    // `.rejects.toThrow()` used now to assert against our expected error message
    let URL = 'https://fake-test-library.org';
    await expect(fetchWithRetry(URL, {}, 1, 1)).rejects.toThrow('Connection aborted');

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(URL, expect.any(Object));
  });
});

describe('setBoundedCache (LRU)', () => {
  let cache: Map<string, string>;

  beforeEach(() => {
    cache = new Map;
  });

  test('values are stored normally when within the limit', () => {
    // Limit is explicitly set to 2 for these tests
    setBoundedCache(cache, 'a', 'first', 2);
    setBoundedCache(cache, 'b', 'second', 2);

    expect(cache.size).toBe(2); // Still within limit, no eviction expected
    expect(cache.get('a')).toBe('first');
    expect(cache.get('b')).toBe('second');
  });

  test('the oldest key (least recently used) is evicted when capacity is exceeded', () => {
    setBoundedCache(cache, 'a', 'first', 2);
    setBoundedCache(cache, 'b', 'second', 2);

    // Limit is 2. The cache is full. 
    // Inserting 'c' should force the oldest key ('a') out from the front of the Map.
    setBoundedCache(cache, 'c', 'third', 2);

    expect(cache.size).toBe(2); // The size ceiling is strictly maintained
    expect(cache.has('a')).toBe(false); // 'a' was pushed out
    expect(cache.get('b')).toBe('second');
    expect(cache.get('c')).toBe('third');
  });

  test('a key\'s recency is refreshed when updated, protecting it from eviction', () => {
    setBoundedCache(cache, 'a', 'first', 2);
    setBoundedCache(cache, 'b', 'second', 2);

    // Re-inserting 'a' triggers the `map.delete(key)` block in our helper before setting it again.
    // This physically moves 'a' to the very back of the Map's insertion order (the "newest" spot).
    setBoundedCache(cache, 'a', 'first-updated', 2);
    
    // Limit is 2. Inserting 'c' forces an eviction.
    // Because 'a' was just bumped to the newest spot, 'b' is now the oldest and should be the one to be evicted!
    setBoundedCache(cache, 'c', 'third', 2);

    expect(cache.size).toBe(2);
    expect(cache.has('b')).toBe(false); // 'b' is evicted
    expect(cache.get('a')).toBe('first-updated'); // 'a' survived because we refreshed it!
    expect(cache.get('c')).toBe('third');
  });
});