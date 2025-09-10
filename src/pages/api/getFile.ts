import type { APIRoute } from "astro";

const FIGMA_TOKEN = import.meta.env.FIGMA_ACCESS_TOKEN ||
  process.env.FIGMA_ACCESS_TOKEN;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.formData();
    const url = data.get("figmaURL")?.toString();

    if (!url) {
      return new Response(JSON.stringify({ success: false, message: "No URL provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const match = url.match(/\/(?:file|design)\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      return new Response(JSON.stringify({ success: false, message: "Invalid Figma URL" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const fileKey = match[1];

    /*const figmaRes = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: {
        "X-Figma-Token": FIGMA_TOKEN
      }
    });

    if (!figmaRes.ok) {
      const text = await figmaRes.text();
      return new Response(JSON.stringify({ success: false, message: `Figma API error: ${text}` }), {
        status: figmaRes.status,
        headers: { "Content-Type": "application/json" }
      });
    }*/

    const figmaData = fileKey;

    return new Response(JSON.stringify({ success: true, fileKey, figmaData }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
