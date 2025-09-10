import type { APIRoute } from "astro";

const FIGMA_TOKEN = import.meta.env.FIGMA_ACCESS_TOKEN ||
  process.env.FIGMA_ACCESS_TOKEN;

const SITE_ORIGIN = "*";

export const GET: APIRoute = async () => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": SITE_ORIGIN,
  };

  return new Response(
    JSON.stringify({
      environment: "production",
      timestamp: new Date().toISOString(),
      envCheck: {
        hasFigmaToken: !!FIGMA_TOKEN,
        tokenLength: FIGMA_TOKEN?.length || 0,
        tokenStart: FIGMA_TOKEN?.substring(0, 10) + "..." || "undefined",
        allEnvKeys: Object.keys(import.meta.env),
        nodeEnv: import.meta.env.NODE_ENV || "not set"
      },
      figmaApiTest: "Will test if token exists"
    }),
    { status: 200, headers }
  );
};

// Helper functions for processing Figma data
const collectTextNodes = (node: any): string[] => {
  if (!node) return [];
  let texts: string[] = [];
  if (node.type === "TEXT" && node.characters) texts.push(node.characters);
  node.children?.forEach((c: any) => texts.push(...collectTextNodes(c)));
  return texts;
};

const flattenFrames = (node: any, frames: any[]) => {
  if (!node) return;
  if (node.type === "FRAME") frames.push(node);
  node.children?.forEach((c: any) => flattenFrames(c, frames));
};

const getComponentType = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("header") || n.includes("navbar")) return "Navbar";
  if (n.includes("hero")) return "Hero";
  if (n.includes("footer")) return "Footer";
  if (n.includes("about")) return "AboutUs";
  if (n.includes("newsletter")) return "Newsletter";
  if (n.includes("blog")) return "Blog";
  if (n.includes("testimonial")) return "Testimonial";
  if (n.includes("gallery") || n.includes("image")) return "Gallery";
  if (n.includes("cta")) return "CTA";
  return "Card";
};

export const POST: APIRoute = async ({ request }) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": SITE_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };

  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers });

  try {
    const formData = await request.formData();
    const figmaURL = formData.get("figmaURL")?.toString();
    
    if (!figmaURL) {
      return new Response(
        JSON.stringify({ message: "No Figma URL provided" }),
        { status: 400, headers }
      );
    }

    // Extract file key from Figma URL
    const match = figmaURL.match(/\/(?:file|design)\/([a-zA-Z0-9]+)/);
    if (!match) {
      return new Response(
        JSON.stringify({ message: "Invalid Figma URL" }), 
        { status: 400, headers }
      );
    }
    
    const fileKey = match[1];

    // Fetch Figma file data
    const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: {
        "X-Figma-Token": FIGMA_TOKEN,
        "User-Agent": "Appwrite-Sites-Bot/1.0",
      },
    });

    if (!res.ok) {
      throw new Error(`Figma API error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();

    // Process the Figma data to extract frames and their metadata
    const allFrames: any[] = [];
    flattenFrames(data.document, allFrames);

    // Process frames to create structured data for generation
    const processedFrames = allFrames.map((frame) => {
      const texts = collectTextNodes(frame);
      const componentType = getComponentType(frame.name);
      const hasChildFrames = frame.children && frame.children.some((c: any) => c.type === "FRAME");
      
      return {
        id: frame.id,
        name: frame.name,
        type: componentType,
        texts,
        hasChildFrames,
        shouldSkip: !texts.length && hasChildFrames, // Skip container frames
        rawNode: frame // Include raw node data for generate.ts if needed
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        figmaURL,
        fileKey,
        totalFrames: allFrames.length,
        processedFrames,
        embedUrl: `https://www.figma.com/embed?embed_host=astra&url=${encodeURIComponent(figmaURL)}`,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers }
    );

  } catch (err: any) {
    console.error("Convert API error:", err);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: err.message,
        timestamp: new Date().toISOString()
      }), 
      { status: 500, headers }
    );
  }
};