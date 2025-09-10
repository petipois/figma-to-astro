import type { APIRoute } from "astro";

const SITE_ORIGIN = "https://figstro.appwrite.network";

// Add OPTIONS handler for CORS preflight
export const OPTIONS: APIRoute = async () => {
    const headers = {
        "Access-Control-Allow-Origin": SITE_ORIGIN,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
        'Vary': 'Origin',
    };
    return new Response(null, { status: 204, headers });
};

export const GET: APIRoute = async () => {
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": SITE_ORIGIN,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
         'Vary': 'Origin',
    };

    return new Response(
        JSON.stringify({
            success: true,
            message: "Test API is working!",
            timestamp: new Date().toISOString(),
            cors: "enabled",
            environment: import.meta.env.MODE || "unknown",
        }),
        { status: 200, headers }
    );
};

export const POST: APIRoute = async ({ request }) => {
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": SITE_ORIGIN,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
         'Vary': 'Origin',
    };

    try {
        const body = await request.text();
        const contentType = request.headers.get('content-type');

        return new Response(
            JSON.stringify({
                success: true,
                message: "Test POST is working!",
                receivedContentType: contentType,
                bodyLength: body.length,
                bodyPreview: body.substring(0, 100),
                timestamp: new Date().toISOString(),
            }),
            { status: 200, headers }
        );

    } catch (err: any) {
        return new Response(
            JSON.stringify({
                success: false,
                message: err.message,
                timestamp: new Date().toISOString(),
            }),
            { status: 500, headers }
        );
    }
};