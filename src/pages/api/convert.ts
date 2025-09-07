import type { APIRoute } from "astro";

const FIGMA_TOKEN = import.meta.env.FIGMA_ACCESS_TOKEN;

// Add logging
console.log('API Route loaded. FIGMA_TOKEN:', FIGMA_TOKEN ? 'Set' : 'Missing');

// Helpers (same as before)
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
  if (!texts.length) texts = [name];

  if (type === "Navbar") {
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

  if (type === "Hero") {
    // For Hero sections, create a hero with navbar
    const navItems = texts.slice(0, 5); // Use first 5 texts as nav items
    const heroTitle = texts[5] || name; // Use 6th text as hero title, fallback to name
    const heroDescription = texts.slice(6, 8).join(" ") || "Welcome to our amazing service"; // Use next texts as description
    
    const navLinks = navItems.map(item => 
      `        <a href="#" class="text-white hover:text-orange-300 px-4 py-2 transition-colors duration-200">${item}</a>`
    ).join("\n");

    return `---
const { title="${heroTitle}" } = Astro.props;
---
<section id="${name}" class="relative min-h-screen bg-gradient-to-br from-green-600 to-green-800">
  <!-- Navbar -->
  <nav class="flex justify-between items-center p-6 text-white">
    <div class="text-2xl font-bold">🌿 ${name}</div>
    <div class="hidden md:flex space-x-1">
${navLinks}
    </div>
    <button class="md:hidden text-white">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
      </svg>
    </button>
  </nav>
  
  <!-- Hero Content -->
  <div class="flex items-center justify-center min-h-[80vh] px-6 text-center">
    <div class="max-w-4xl text-white">
      <h1 class="text-5xl md:text-7xl font-bold mb-6">{title}</h1>
      <p class="text-xl md:text-2xl mb-8 opacity-90">${heroDescription}</p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button class="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105">
          Get Started
        </button>
        <button class="border-2 border-white text-white hover:bg-white hover:text-green-800 font-semibold py-3 px-8 rounded-lg transition-all duration-200">
          Learn More
        </button>
      </div>
    </div>
  </div>
</section>`;
  }

  if (type === "Card") {
    const title = texts[0];
    const description = texts.slice(1, 5);
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
  console.log('API Route hit:', request.method, request.url);

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*", // Changed for debugging
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    console.log('OPTIONS request handled');
    return new Response(null, { status: 204, headers });
  }

  try {
    // Check if FIGMA_TOKEN exists
    if (!FIGMA_TOKEN) {
      console.error('FIGMA_ACCESS_TOKEN not found in environment variables');
      return new Response(
        JSON.stringify({ message: "Server configuration error: Missing Figma token" }),
        { status: 500, headers }
      );
    }

    const formData = await request.formData();
    const figmaURL = formData.get("figmaURL")?.toString();
    console.log('Received figmaURL:', figmaURL);

    if (!figmaURL) {
      console.log('No figmaURL provided');
      return new Response(
        JSON.stringify({ message: "No Figma URL provided" }),
        { status: 400, headers }
      );
    }

    const match = figmaURL.match(/\/(?:file|design)\/([a-zA-Z0-9]+)/);
    if (!match) {
      console.log('Invalid Figma URL format');
      return new Response(JSON.stringify({ message: "Invalid Figma URL" }), {
        status: 400,
        headers,
      });
    }
    const fileKey = match[1];
    console.log('Extracted fileKey:', fileKey);

    console.log('Making request to Figma API...');
    const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { "X-Figma-Token": FIGMA_TOKEN },
    });

    console.log('Figma API response status:', res.status);
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Figma API error:', res.status, errorText);
      throw new Error(`Figma API error ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log('Figma data received, processing...');

    const allFrames: any[] = [];
    flattenFrames(data.document, allFrames);
    console.log('Found frames:', allFrames.length);

    const sections: any[] = [];
    const seenTypes = new Set<string>();

    allFrames.forEach((f) => {
      const type = getComponentType(f.name);

      if (["Card", "Blog", "Testimonial"].includes(type)) {
        if (seenTypes.has(type)) return;
        seenTypes.add(type);
      }

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

    console.log('Generated sections:', sections.length);

    const response = {
      figmaURL,
      fileKey,
      totalFrames: allFrames.length,
      totalSections: sections.length,
      sections,
      embedUrl: `https://www.figma.com/embed?embed_host=astra&url=${encodeURIComponent(figmaURL)}`,
    };

    console.log('Sending successful response');
    return new Response(JSON.stringify(response), { status: 200, headers });

  } catch (err: any) {
    console.error('API Route error:', err);
    return new Response(JSON.stringify({ 
      message: err.message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    }), {
      status: 500,
      headers,
    });
  }
};