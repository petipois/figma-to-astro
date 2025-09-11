import type { APIRoute } from "astro";

const SITE_ORIGIN = "https://figstro.appwrite.network";

// CORS preflight
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

// Component counters for unique names
const componentCounters: Record<string, number> = {};
const getUniqueName = (base: string) => {
  componentCounters[base] = (componentCounters[base] || 0) + 1;
  return componentCounters[base] > 1 ? `${base}${componentCounters[base]}` : base;
};

// Recursive text extractor
function extractTexts(node: any): string[] {
  const texts: string[] = [];

  function walk(n: any) {
    if (!n) return;

    // Only process Figma TEXT nodes with characters
    if (n.type === "TEXT" && typeof n.characters === "string") {
      // l is a string
      texts.push(
        ...n.characters
          .split(/\r?\n/)          // Split multi-line text
          .map((l: string) => l.trim()) // Trim each line
          .filter(Boolean)         // Remove empty lines
      );
    }

    if (n.children && Array.isArray(n.children)) {
      n.children.forEach(walk);
    }
  }

  walk(node);
  return texts;
}


// Generate Astro component code
const generateAstroCode = (type: string, name: string, texts: string[]) => {
  if (!texts || texts.length === 0) texts = [name];

  if (type === "Navbar") {
    const links = texts.map(t => `<a href="#" class="text-gray-700 hover:text-orange-500 px-4 py-2">${t}</a>`).join("\n    ");
    return `---
const { title="${name}" } = Astro.props;
---
<nav id="${name}" class="p-4 mb-4 bg-white shadow rounded flex justify-center space-x-2 flex-wrap">
  ${links}
</nav>`;
  }

  if (type === "Hero") {
    const title = texts[0] || name;
    const subtitle = texts.slice(1, texts.length - 1).join(" ") || "Welcome to our amazing website";
    const cta = texts[texts.length - 1] || "Get Started";
    return `---
const { title="${title}", subtitle="${subtitle}", cta="${cta}" } = Astro.props;
---
<section id="${name}" class="p-8 mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded shadow-lg text-center">
  <h1 class="font-bold text-4xl mb-4">{title}</h1>
  <p class="text-xl mb-6">{subtitle}</p>
  <button class="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
    {cta}
  </button>
</section>`;
  }

  if (type === "Footer") {
    const links = texts.slice(0, 6).map(t => `<a href="#" class="text-gray-400 hover:text-white">${t}</a>`).join("\n      ");
    return `---
const { title="${name}", year = new Date().getFullYear() } = Astro.props;
---
<footer id="${name}" class="p-6 mt-8 bg-gray-800 text-white rounded">
  <div class="flex justify-center space-x-4 mb-4 flex-wrap">
    ${links}
  </div>
  <div class="text-center text-gray-400">
    <p>&copy; {year} {title}. All rights reserved.</p>
  </div>
</footer>`;
  }

  // Default section
  const title = texts[0] || name;
  const description = texts.slice(1).join(" ") || `This is a ${type.toLowerCase()} section.`;
  return `---
const { title="${title}", description="${description}" } = Astro.props;
---
<section id="${name}" class="p-4 mb-4 border rounded bg-white shadow">
  <h2 class="font-bold text-xl mb-4">{title}</h2>
  <p>{description}</p>
</section>`;
};

// GET endpoint
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    message: "POST to generate Astro components from processed Figma JSON",
    timestamp: new Date().toISOString(),
  }), { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": SITE_ORIGIN }});
};

// POST endpoint
export const POST: APIRoute = async ({ request }) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": SITE_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

  try {
    Object.keys(componentCounters).forEach(k => componentCounters[k] = 0);
    const body = await request.json();
    const { processedFrames, figmaURL, fileKey } = body;

    if (!processedFrames || !Array.isArray(processedFrames)) {
      return new Response(JSON.stringify({ success: false, message: "No processedFrames data" }), { status: 400, headers });
    }

    const sections: any[] = [];
    const seenTypes = new Set<string>();

    processedFrames.forEach((frame: any) => {
      let { type, texts, shouldSkip, name, rawNode } = frame;
      if (shouldSkip) return;

      // Extract texts from rawNode if missing
      if (!texts || texts.length === 0) texts = extractTexts(rawNode);

      // Skip duplicates for certain types
      if (["Card", "Blog", "Testimonial"].includes(type)) {
        if (seenTypes.has(type)) return;
        seenTypes.add(type);
      }

      const uniqueName = getUniqueName(type);
      const astroCode = generateAstroCode(type, uniqueName, texts);

      sections.push({
        id: frame.id,
        originalName: name,
        componentName: uniqueName,
        componentType: type,
        texts,
        code: astroCode
      });
    });

    // Assemble index.astro
    const imports = sections.map(s => `import ${s.componentName} from './components/${s.componentName}.astro';`).join("\n");

    const navbar = sections.find(s => s.componentType === "Navbar");
    const footer = sections.find(s => s.componentType === "Footer");
    const otherSections = sections.filter(s => !["Navbar", "Footer"].includes(s.componentType));

    const indexFile = `---
${imports}
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="generator" content={Astro.generator} />
    <title>Generated from Figma</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-100 min-h-screen">
    ${navbar ? `<${navbar.componentName} />` : ""}
    <div class="container mx-auto px-4 py-8">
      ${otherSections.map(s => `<${s.componentName} />`).join("\n      ")}
    </div>
    ${footer ? `<${footer.componentName} />` : ""}
  </body>
</html>`;

    return new Response(JSON.stringify({
      success: true,
      figmaURL,
      fileKey,
      totalComponents: sections.length,
      sections,
      indexFile,
      timestamp: new Date().toISOString(),
      generationStats: {
        totalFrames: processedFrames.length,
        generatedComponents: sections.length,
        skippedFrames: processedFrames.filter(f => f.shouldSkip).length,
      }
    }), { status: 200, headers });

  } catch (err: any) {
    console.error("Generate API error:", err);
    return new Response(JSON.stringify({
      success: false,
      message: err.message,
      timestamp: new Date().toISOString()
    }), { status: 500, headers });
  }
};
