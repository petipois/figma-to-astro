import type { APIRoute } from "astro";

const FIGMA_TOKEN = import.meta.env.FIGMA_ACCESS_TOKEN;

// Helpers
const componentCounters: Record<string, number> = {};
const getUniqueName = (base: string) => {
  componentCounters[base] = (componentCounters[base] || 0) + 1;
  return componentCounters[base] > 1 ? `${base}${componentCounters[base]}` : base;
};

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

const generateAstroCode = (type: string, name: string, texts: string[], node: any) => {
  if (!texts.length) texts = [name]; // fallback

  if (type === "Navbar") {
    // Render each text as a nav link
    const links = texts.map(t => `<a href="#" class="text-gray-700 hover:text-orange-500 px-4 py-2">${t}</a>`).join("\n");
    return `---
const { title="${name}" } = Astro.props;
---
<nav id="${name}" class="p-4 mb-4 bg-white shadow rounded flex justify-center space-x-2">
  ${links}
</nav>`;
  }

  if (type === "Gallery") {
    const images = texts.slice(0, 8).map((t, i) =>
      `<div class="flex flex-col items-center">
        <img src="https://via.placeholder.com/150?text=Image+${i + 1}" alt="${t}" class="rounded shadow mb-2"/>
        <span class="text-sm text-gray-600 text-center">${t}</span>
      </div>`
    ).join("\n");

    return `---
const { title="${name}" } = Astro.props;
---
<section id="${name}" class="p-4 mb-4 border rounded bg-white shadow">
  <h2 class="font-bold text-xl mb-4">{title}</h2>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    ${images}
  </div>
</section>`;
  }

  if (type === "Card") {
    const title = texts[0];
    const description = texts.slice(1, 5); // first 4 texts for description
    const descriptionHtml = description.map(d => `<p class="text-gray-700 mb-2">${d}</p>`).join("\n");

    return `---
const { title="${title}" } = Astro.props;
---
<div id="${name}" class="p-4 mb-4 border rounded bg-white shadow hover:shadow-lg transition-shadow duration-200">
  <h3 class="font-bold text-lg mb-2">${title}</h3>
  ${descriptionHtml}
  <img src="https://via.placeholder.com/300x150" alt="${title}" class="rounded mt-2"/>
</div>`;
  }

  // Default section
  const descriptionHtml = texts.slice(0, 5).map(t => `<p class="mb-2">${t}</p>`).join("\n");
  return `---
const { title="${name}" } = Astro.props;
---
<section id="${name}" class="p-4 mb-4 border rounded bg-white shadow">
  <h2 class="font-bold mb-2">${name}</h2>
  ${descriptionHtml}
</section>`;
};



export const POST: APIRoute = async ({ request }) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers });

  try {
    const formData = await request.formData();
    const figmaURL = formData.get("figmaURL")?.toString();
    if (!figmaURL)
      return new Response(
        JSON.stringify({ message: "No Figma URL provided" }),
        { status: 400, headers }
      );

    const match = figmaURL.match(/\/(?:file|design)\/([a-zA-Z0-9]+)/);
    if (!match)
      return new Response(JSON.stringify({ message: "Invalid Figma URL" }), {
        status: 400,
        headers,
      });
    const fileKey = match[1];

    const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { "X-Figma-Token": FIGMA_TOKEN },
    });
    if (!res.ok) throw new Error(`Figma API error ${res.status}`);
    const data = await res.json();

    const allFrames: any[] = [];
    flattenFrames(data.document, allFrames);

    const sections: any[] = [];
    const seenTypes = new Set<string>();

    allFrames.forEach((f) => {
      const type = getComponentType(f.name);

      // Skip duplicates for card/blog/testimonial (only one instance)
      if (["Card", "Blog", "Testimonial"].includes(type)) {
        if (seenTypes.has(type)) return;
        seenTypes.add(type);
      }

      // Skip long container frames (frames that only wrap others and no text)
      const texts = collectTextNodes(f);
      const hasChildFrames =
        f.children && f.children.some((c: any) => c.type === "FRAME");
      if (!texts.length && hasChildFrames) return;

      const uniqueName = getUniqueName(type);
      sections.push({
        id: f.id,
        name: f.name,
        component: uniqueName,
        code: generateAstroCode(type, uniqueName, texts, f),
      });
    });

    return new Response(
      JSON.stringify({
        figmaURL,
        fileKey,
        totalFrames: allFrames.length,
        totalSections: sections.length,
        sections,
        embedUrl: `https://www.figma.com/embed?embed_host=astra&url=${encodeURIComponent(
          figmaURL
        )}`,
      }),
      { status: 200, headers }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ message: err.message }), {
      status: 500,
      headers,
    });
  }
};
