import { Hono } from 'hono';
import crypto from 'node:crypto';

type Bindings = {
    PROXY_SECRET: string;
    API_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const FETCH_TIMEOUT_MS = 30_000;
const MAX_BODY_SIZE = 650 * 1024 * 1024; // 650 MB

// Helper to extract media type/extension to match Functions.getMediaType in backend
function getMediaType(url: string): string {
    try {
        const parsedUrl = new URL(url);
        const extension = parsedUrl.pathname.split('.').pop()?.toLowerCase() || '';
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) {
            return 'image';
        } else if (['mp4', 'webm', 'mkv', 'mov'].includes(extension)) {
            return 'video';
        } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
            return 'audio';
        }
    } catch (_) {}
    return 'null';
}

// OPTIONS preflight handler
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

// URL generation endpoint (optional, mirrors ProxyService.useProxy)
app.get('/proxy/generate', (c) => {
    const url = c.req.query('url');
    const source = c.req.query('source') || 'Unknown';
    const forceFileType = c.req.query('forceFileType') || 'false';

    if (!url) return c.text('Missing URL', 400);

    const expires = Math.floor(Date.now() / 1000) + 900;
    if (!c.env.PROXY_SECRET) {
        console.error('ProxyService: PROXY_SECRET environment variable is not defined in the Worker!');
        return c.text('Configuration error: PROXY_SECRET is not set', 500);
    }

    const token = crypto
        .createHmac('sha256', c.env.PROXY_SECRET)
        .update(url + expires)
        .digest('hex');

    const fileType = forceFileType === 'false' ? getMediaType(url) : forceFileType;

    const proxyUrl = `${c.env.API_URL}/proxy?url=${encodeURIComponent(url)}&token=${token}&expires=${expires}&type=${fileType}&source=${source}`;
    return c.json({ proxyUrl });
});

// Proxy handler logic
const handleProxy = async (c: any) => {
    const targetUrl = c.req.query('url');
    const token = c.req.query('token');
    const expires = c.req.query('expires');
    const range = c.req.header('range');

    // 1. Check essential parameters
    if (!targetUrl || !token || !expires) {
        console.warn('ProxyService: Missing parameters', { url: targetUrl, token, expires });
        return c.text('Missing parameters', 403);
    }

    // 2. Verify link expiration
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

    // 4. Validate protocol
    try {
        const urlObj = new URL(targetUrl);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            console.warn('ProxyService: Invalid protocol', { url: targetUrl });
            return c.text('Invalid protocol', 400);
        }
    } catch (e) {
        console.warn('ProxyService: Invalid URL format', { url: targetUrl });
        return c.text('Invalid URL', 400);
    }

    // 5. Prepare upstream request headers
    const headers: Record<string, string> = {
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
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
            console.warn(`ProxyService: Upstream error (502): ${response.status} ${response.statusText}`, { url: targetUrl });
            return c.text('Upstream error', 502);
        }

        // 6. Check content-length header
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
            console.warn(`ProxyService: File too large (Content-Length): ${contentLength} bytes`, { url: targetUrl });
            return c.text('File too large', 413);
        }

        // 7. Forward response headers
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

        // Set CORS and Cache-Control
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Cache-Control', 'public, max-age=3600');

        // 8. Stream the response body and enforce MAX_BODY_SIZE during stream
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
                    console.warn(`ProxyService: Stream exceeded max body size of ${MAX_BODY_SIZE} bytes`, { url: targetUrl });
                    controller.error(new Error('File too large'));
                    return;
                }
                controller.enqueue(chunk);
            }
        });

        const monitoredBody = response.body.pipeThrough(monitorStream);

        return new Response(monitoredBody, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });

    } catch (err: any) {
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
