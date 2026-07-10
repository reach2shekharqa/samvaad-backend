/**
 * Simple in-memory cache for repository discovery results
 * Key format: `owner/repo`
 * TTL: 1 hour (3600 seconds)
 */

class DiscoveryCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 3600 * 1000; // 1 hour in milliseconds
  }

  /**
   * Get cached discovery result
   */
  get(owner, repo) {
    const key = `${owner}/${repo}`;
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    console.log(`✅ CACHE HIT: ${key}`);
    return cached.data;
  }

  /**
   * Set cache entry
   */
  set(owner, repo, data) {
    const key = `${owner}/${repo}`;
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`💾 CACHE SET: ${key}`);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  stats() {
    return {
      size: this.cache.size,
      ttl: `${this.ttl / 1000 / 60} minutes`
    };
  }
}

export default new DiscoveryCache();
