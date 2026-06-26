import { Hono } from 'hono';
import crypto from 'node:crypto';
const app = new Hono();
const FETCH_TIMEOUT_MS = 30_000;
const MAX_BODY_SIZE = 650 * 1024 * 1024; // 650 MB
app.options('*', (c) => {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Range, Content-Type',
            'Access-Control-Max-Age': '86400',
        },
    });
});
const handleProxy = async (c) => {
    const targetUrl = c.req.query('url');
    const token = c.req.query('token');
    const expires = c.req.query('expires');
    const range = c.req.header('range');
    if (!targetUrl && !token && !expires) {
        return c.text('LiveChat Proxy is running!', 200);
    }
    if (!targetUrl || !token || !expires) {
        console.warn('ProxyService: Missing parameters', { url: targetUrl, token, expires });
        return c.text('Missing parameters', 400);
    }
    const now = Math.floor(Date.now() / 1000);
    if (now > parseInt(expires)) {
        console.warn('ProxyService: Expired link', { url: targetUrl, expires, now });
        return c.text('Expired link', 403);
    }
    if (!c.env.PROXY_SECRET) {
        console.error('ProxyService: PROXY_SECRET environment variable is not defined in the Worker!');
        return c.text('Configuration error: PROXY_SECRET is not set', 500);
    }
    const expectedToken = crypto
        .createHmac('sha256', c.env.PROXY_SECRET)
        .update(targetUrl + expires)
        .digest('hex');
    if (token !== expectedToken) {
        console.warn('ProxyService: Invalid signature', { url: targetUrl });
        return c.text('Invalid signature', 403);
    }
    try {
        const urlObj = new URL(targetUrl);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            console.warn('ProxyService: Invalid protocol', { url: targetUrl });
            return c.text('Invalid protocol', 400);
        }
    }
    catch (e) {
        console.warn('ProxyService: Invalid URL format', { url: targetUrl });
        return c.text('Invalid URL', 400);
    }
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    };
    if (range) {
        headers['Range'] = range;
    }
    const abortController = new AbortController();
    const fetchTimeout = setTimeout(() => abortController.abort(), FETCH_TIMEOUT_MS);
    try {
        const response = await fetch(targetUrl, {
            headers,
            redirect: 'follow',
            signal: abortController.signal,
        });
        clearTimeout(fetchTimeout);
        if (!response.ok) {
            console.warn(`ProxyService: Upstream error (502): ${response.status} ${response.statusText}`, {
                url: targetUrl,
            });
            return c.text('Upstream error', 502);
        }
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
            console.warn(`ProxyService: File too large (Content-Length): ${contentLength} bytes`, { url: targetUrl });
            return c.text('File too large', 413);
        }
        const headersToForward = [
            'content-type',
            'content-length',
            'content-range',
            'accept-ranges',
            'last-modified',
            'etag',
        ];
        const responseHeaders = new Headers();
        for (const h of headersToForward) {
            const val = response.headers.get(h);
            if (val) {
                responseHeaders.set(h, val);
            }
        }
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Cache-Control', 'public, max-age=3600');
        if (!response.body) {
            return new Response(null, {
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
            });
        }
        let receivedBytes = 0;
        const monitorStream = new TransformStream({
            transform(chunk, controller) {
                receivedBytes += chunk.byteLength;
                if (receivedBytes > MAX_BODY_SIZE) {
                    console.warn(`ProxyService: Stream exceeded max body size of ${MAX_BODY_SIZE} bytes`, {
                        url: targetUrl,
                    });
                    controller.error(new Error('File too large'));
                    return;
                }
                controller.enqueue(chunk);
            },
        });
        const monitoredBody = response.body.pipeThrough(monitorStream);
        return new Response(monitoredBody, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
    }
    catch (err) {
        clearTimeout(fetchTimeout);
        if (err.name === 'AbortError') {
            console.warn('ProxyService: Upstream timeout (504) or client disconnected', { url: targetUrl });
            return c.text('Upstream timeout', 504);
        }
        console.error('ProxyService: Error while proxying (500)', err);
        return c.text('Internal Server Error', 500);
    }
};
app.get('/proxy', handleProxy);
app.get('/', handleProxy);
export default app;
