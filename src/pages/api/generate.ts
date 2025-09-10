import type { APIRoute } from "astro";

const SITE_ORIGIN = "*";

// Component generation helpers
const componentCounters: Record<string, number> = {};

const getUniqueName = (base: string) => {
  componentCounters[base] = (componentCounters[base] || 0) + 1;
  return componentCounters[base] > 1 ? `${base}${componentCounters[base]}` : base;
};

const generateAstroCode = (type: string, name: string, texts: string[], node: any) => {
  if (!texts.length) texts = [name]; // fallback

  if (type === "Navbar") {
    // Render each text as a nav link
    const links = texts.map(t => `<a href="#" class="text-gray-700 hover:text-orange-500 px-4 py-2">${t}</a>`).join("\n    ");
    return `---
const { title="${name}" } = Astro.props;
---
<nav id="${name}" class="p-4 mb-4 bg-white shadow rounded flex justify-center space-x-2">
  ${links}
</nav>`;
  }

  if (type === "Hero") {
    const title = texts[0] || name;
    const subtitle = texts[1] || "Welcome to our amazing website";
    const cta = texts[2] || "Get Started";
    
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
const { title="${name}" } = Astro.props;
---
<footer id="${name}" class="p-6 mb-4 bg-gray-800 text-white rounded">
  <div class="flex justify-center space-x-4 mb-4">
    ${links}
  </div>
  <div class="text-center text-gray-400">
    <p>&copy; 2024 {title}. All rights reserved.</p>
  </div>
</footer>`;
  }

  if (type === "Gallery") {
    const images = texts.slice(0, 8).map((t, i) =>
      `<div class="flex flex-col items-center">
        <img src="https://via.placeholder.com/150?text=Image+${i + 1}" alt="${t}" class="rounded shadow mb-2"/>
        <span class="text-sm text-gray-600 text-center">${t}</span>
      </div>`
    ).join("\n    ");

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

  if (type === "Testimonial") {
    const quote = texts[0] || "This is an amazing service!";
    const author = texts[1] || "Happy Customer";
    const role = texts[2] || "Customer";
    
    return `---
const { quote="${quote}", author="${author}", role="${role}" } = Astro.props;
---
<section id="${name}" class="p-6 mb-4 bg-gray-50 border-l-4 border-blue-500 rounded shadow">
  <blockquote class="text-lg italic text-gray-700 mb-4">"{quote}"</blockquote>
  <div class="flex items-center">
    <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
      {author.charAt(0)}
    </div>
    <div>
      <p class="font-semibold">{author}</p>
      <p class="text-gray-600 text-sm">{role}</p>
    </div>
  </div>
</section>`;
  }

  if (type === "Newsletter") {
    const title = texts[0] || "Subscribe to our newsletter";
    const description = texts[1] || "Get the latest updates and news.";
    
    return `---
const { title="${title}", description="${description}" } = Astro.props;
---
<section id="${name}" class="p-6 mb-4 bg-blue-50 border rounded shadow">
  <h3 class="font-bold text-xl mb-2">{title}</h3>
  <p class="text-gray-700 mb-4">{description}</p>
  <div class="flex gap-2">
    <input type="email" placeholder="Enter your email" class="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
    <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
      Subscribe
    </button>
  </div>
</section>`;
  }

  if (type === "CTA") {
    const title = texts[0] || "Ready to get started?";
    const description = texts[1] || "Join thousands of satisfied customers.";
    const buttonText = texts[2] || "Get Started Now";
    
    return `---
const { title="${title}", description="${description}", buttonText="${buttonText}" } = Astro.props;
---
<section id="${name}" class="p-8 mb-4 bg-orange-500 text-white rounded shadow-lg text-center">
  <h2 class="font-bold text-2xl mb-2">{title}</h2>
  <p class="text-lg mb-6">{description}</p>
  <button class="bg-white text-orange-500 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg">
    {buttonText}
  </button>
</section>`;
  }

  if (type === "Card") {
    const title = texts[0] || name;
    const description = texts.slice(1, 4); // first 3 texts for description
    const descriptionHtml = description.length > 0 
      ? description.map(d => `<p class="text-gray-700 mb-2">${d}</p>`).join("\n  ")
      : `<p class="text-gray-700 mb-2">This is a card component with some description text.</p>`;

    return `---
const { title="${title}" } = Astro.props;
---
<div id="${name}" class="p-4 mb-4 border rounded bg-white shadow hover:shadow-lg transition-shadow duration-200">
  <h3 class="font-bold text-lg mb-2">{title}</h3>
  ${descriptionHtml}
  <img src="https://via.placeholder.com/300x150?text=${encodeURIComponent(title)}" alt="${title}" class="rounded mt-2 w-full"/>
</div>`;
  }

  // Default section for AboutUs, Blog, or any other type
  const title = texts[0] || name;
  const descriptionHtml = texts.slice(1, 4).length > 0
    ? texts.slice(1, 4).map(t => `<p class="mb-2">${t}</p>`).join("\n  ")
    : `<p class="mb-2">This is a ${type.toLowerCase()} section with some content.</p>`;

  return `---
const { title="${title}" } = Astro.props;
---
<section id="${name}" class="p-4 mb-4 border rounded bg-white shadow">
  <h2 class="font-bold text-xl mb-4">{title}</h2>
  ${descriptionHtml}
</section>`;
};

export const GET: APIRoute = async () => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": SITE_ORIGIN,
  };

  return new Response(
    JSON.stringify({
      message: "Generate API - POST to generate Astro components from processed Figma data",
      timestamp: new Date().toISOString(),
    }),
    { status: 200, headers }
  );
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
    // Reset counters for each generation request
    Object.keys(componentCounters).forEach(key => {
      componentCounters[key] = 0;
    });

    const body = await request.json();
    const { processedFrames, figmaURL, fileKey } = body;

    if (!processedFrames || !Array.isArray(processedFrames)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No processed frames data provided" 
        }),
        { status: 400, headers }
      );
    }

    const sections: any[] = [];
    const seenTypes = new Set<string>();

    processedFrames.forEach((frame: any) => {
      const { type, texts, shouldSkip, name } = frame;

      // Skip container frames
      if (shouldSkip) return;

      // Skip duplicates for certain component types (only one instance)
      if (["Card", "Blog", "Testimonial"].includes(type)) {
        if (seenTypes.has(type)) return;
        seenTypes.add(type);
      }

      const uniqueName = getUniqueName(type);
      const astroCode = generateAstroCode(type, uniqueName, texts, frame.rawNode);

      sections.push({
        id: frame.id,
        originalName: name,
        componentName: uniqueName,
        componentType: type,
        texts,
        code: astroCode,
      });
    });

    // Generate a complete index.astro file that imports and uses all components
    const imports = sections.map(s => `import ${s.componentName} from './components/${s.componentName}.astro';`).join('\n');
    const components = sections.map(s => `<${s.componentName} />`).join('\n  ');

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
    <div class="container mx-auto px-4 py-8">
      ${components}
    </div>
  </body>
</html>`;

    return new Response(
      JSON.stringify({
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
          skippedFrames: processedFrames.filter((f: any) => f.shouldSkip).length,
        }
      }),
      { status: 200, headers }
    );

  } catch (err: any) {
    console.error("Generate API error:", err);
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