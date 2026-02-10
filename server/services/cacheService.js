const Settings = require('../models/Settings');

class CacheService {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 60 * 5; // 5 minutes default
        console.log('Cache Service initialized (In-Memory)');
    }

    // Get data from cache
    get(key) {
        if (!this.cache.has(key)) return null;

        const item = this.cache.get(key);
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    // Set data to cache
    set(key, data, ttlSeconds = this.defaultTTL) {
        const expiry = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, {
            data,
            expiry
        });
    }

    // Delete specific key
    del(key) {
        this.cache.delete(key);
    }

    // Flush all cache
    flush() {
        this.cache.clear();
        console.log('Cache flushed');
    }

    // Middleware to handle caching for routes
    middleware(duration = 300) {
        return async (req, res, next) => {
            // 1. Check if Cache Service is enabled (Global flag)
            if (!global.cacheEnabled && !process.env.FORCE_CACHE) {
                return next();
            }

            // 2. Only cache GET requests
            if (req.method !== 'GET') {
                // Invalidate cache on mutations?
                // Let's do it in a separate middleware or here if it passes through?
                // This middleware is usually applied to GET routes.
                // If applied globally, we can flush here.
                if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
                    this.flush(); // Simple strategy: Flush all on any change
                }
                return next();
            }

            // 3. Generate Key
            // key must include User ID to prevent leaking data between users
            const userId = req.user ? req.user.id : 'public';
            const key = `__cache__${req.originalUrl || req.url}__${userId}`;

            const cachedBody = this.get(key);

            if (cachedBody) {
                res.setHeader('X-Cache', 'HIT');
                return res.json(cachedBody);
            } else {
                res.setHeader('X-Cache', 'MISS');
                const originalSend = res.json;
                res.json = (body) => {
                    this.set(key, body, duration);
                    originalSend.call(res, body);
                };
                next();
            }
        };
    }

    setEnabled(enabled) {
        if (!enabled) this.flush();
        global.cacheEnabled = enabled;
        console.log(`Cache Service ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }
}

// Create singleton
const cacheService = new CacheService();

module.exports = cacheService;
