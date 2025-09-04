import type { APIRoute } from "astro";

const FIGMA_TOKEN = import.meta.env.FIGMA_ACCESS_TOKEN;

// Track unique component names
const componentCounters: Record<string, number> = {};
const getUniqueComponentName = (baseName: string) => {
  componentCounters[baseName] = (componentCounters[baseName] || 0) + 1;
  const count = componentCounters[baseName];
  return count > 1 ? `${baseName}${count}` : baseName;
};

// Tailwind helpers
const rgbaToTailwind = (color: { r: number; g: number; b: number; a?: number }) => {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a ?? 1;
  if (a === 1) return `bg-[rgb(${r},${g},${b})]`;
  return `bg-[rgba(${r},${g},${b},${a})]`;
};

const fontSizeMap = (size: number) => {
  if (size <= 12) return "text-xs";
  if (size <= 14) return "text-sm";
  if (size <= 16) return "text-base";
  if (size <= 20) return "text-lg";
  if (size <= 24) return "text-xl";
  if (size <= 30) return "text-2xl";
  if (size <= 36) return "text-3xl";
  if (size <= 48) return "text-4xl";
  return "text-5xl";
};

const fontWeightMap = (weight: number) => {
  if (weight <= 300) return "font-light";
  if (weight <= 500) return "font-medium";
  if (weight <= 700) return "font-bold";
  return "font-extrabold";
};

// Component type detection
const getComponentNameBySize = (frame: any) => {
  const width = frame.absoluteBoundingBox?.width || 0;
  const height = frame.absoluteBoundingBox?.height || 0;
  const area = width * height;
  if (area > 100000) return "Section";
  if (area > 40000) return "Hero";
  if (area > 10000) return "Card";
  return "Card";
};

const getComponentName = (frame: any) => {
  const name = frame.name.toLowerCase();
  if (name.includes("header")) return "Header";
  if (name.includes("footer")) return "Footer";
  if (name.includes("hero")) return "Hero";
  if (name.includes("card")) return "Card";
  if (name.includes("section")) return "Section";
  if (name.includes("navbar")) return "Navbar";
  if (name.includes("testimonial")) return "Testimonial";
  return getComponentNameBySize(frame);
};

// Collect text nodes recursively
const collectTextNodes = (node: any): string[] => {
  const texts: string[] = [];
  if (!node) return texts;
  if (node.type === "TEXT" && node.characters) texts.push(node.characters);
  node.children?.forEach((child: any) => texts.push(...collectTextNodes(child)));
  return texts;
};

// Tailwind styles
const getTailwindFill = (node: any) => {
  if (!node.fills) return "";
  const solid = node.fills.find((f: any) => f.type === "SOLID");
  if (!solid) return "";
  return rgbaToTailwind(solid.color);
};

const getTailwindShadow = (node: any) => {
  if (!node.effects) return "";
  const shadow = node.effects.find((e: any) => e.type === "DROP_SHADOW");
  return shadow ? "shadow-md" : "";
};

const getTailwindBorder = (node: any) => {
  if (!node.strokes || !node.strokeWeight) return "";
  return `border-[${node.strokeWeight}px] border-black`;
};

// Generate Astro code
const generateAstroCode = (componentName: string, node: any, textNodes: string[], uniqueName: string) => {
  const textContent = textNodes.join("\n");
  const bg = getTailwindFill(node);
  const shadow = getTailwindShadow(node);
  const border = getTailwindBorder(node);
  const textStyle = node.style ? `${fontSizeMap(node.style.fontSize)} ${fontWeightMap(node.style.fontWeight)}` : "text-base";

  switch (componentName) {
    case "Header":
      return `---\nconst { title } = Astro.props;\n---\n<header class="mb-8 p-8 text-center ${bg} ${shadow} ${border}" id="${uniqueName}">\n  <h1 class="${textStyle}">${textContent}</h1>\n</header>`;
    case "Hero":
      return `---\nconst { textContent="${textContent}", buttonText="Call To Action", buttonLink="#" } = Astro.props;\n---\n<section class="py-8 px-4 mx-auto max-w-screen-xl text-center ${bg} ${shadow} ${border}" id="${uniqueName}">\n  <h1 class="${textStyle} font-extrabold mb-4">${textContent}</h1>\n  <a href={buttonLink} class="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-white rounded-lg bg-blue-700 hover:bg-blue-800">{buttonText}</a>\n</section>`;
    case "Card":
      return `---\nconst { textContent="${textContent}", link="#" } = Astro.props;\n---\n<a href={link} id="${uniqueName}" class="block max-w-sm p-6 rounded-lg ${bg} ${shadow} ${border} hover:bg-gray-100">\n  <h5 class="${textStyle} mb-2 font-bold">${textContent}</h5>\n  <p class="font-normal text-gray-700">Card description here.</p>\n</a>`;
    case "Navbar":
      return `---\nconst { navList } = Astro.props;\n---\n<nav class="mb-8 p-4 flex justify-between items-center ${bg} ${shadow} ${border}" id="${uniqueName}">\n  <ul class="flex gap-4">{navList.map(item => (<li>{item}</li>))}</ul>\n</nav>`;
    case "Testimonial":
      return `---\nconst { testimonies } = Astro.props;\n---\n<section class="mb-8 p-6 rounded-lg ${bg} ${shadow} ${border}" id="${uniqueName}">\n  {testimonies.map(t => (<blockquote class="italic mb-2">"{t}"</blockquote>))}\n</section>`;
    case "Footer":
      return `---\nconst year = new Date().getFullYear();\n---\n<footer class="mt-8 p-6 text-center ${bg} ${shadow} ${border}" id="${uniqueName}">\n  <p>${textContent} | @ {year} All rights reserved</p>\n</footer>`;
    default:
      return `---\nconst { title } = Astro.props;\n---\n<section class="mb-8 p-4 rounded-lg ${bg} ${shadow} ${border}" id="${uniqueName}">\n  <h2 class="text-2xl font-semibold mb-2">${uniqueName}</h2>\n  <pre class="bg-gray-100 p-3 rounded mb-4 overflow-x-auto">${textContent}</pre>\n</section>`;
  }
};

// Flatten frames recursively
const flattenFrames = (node: any, frames: any[]) => {
  if (!node) return;
  if (node.type === "FRAME") frames.push(node);
  node.children?.forEach((child: any) => flattenFrames(child, frames));
};

// Export POST route with CORS
export const POST: APIRoute = async ({ request }) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    const formData = await request.formData();
    const figmaURL = formData.get("figmaURL")?.toString();
    if (!figmaURL) return new Response(JSON.stringify({ message: "No Figma URL provided" }), { status: 400, headers });

    const match = figmaURL.match(/\/(?:file|design)\/([a-zA-Z0-9]+)/);
    if (!match) return new Response(JSON.stringify({ message: "Invalid Figma URL" }), { status: 400, headers });

    const fileKey = match[1];
    const fileRes = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { "X-Figma-Token": FIGMA_TOKEN }
    });
    if (!fileRes.ok) throw new Error(`Figma API error: ${fileRes.status}`);
    const fileData = await fileRes.json();

    const allFrames: any[] = [];
    flattenFrames(fileData.document, allFrames);

    const sections: Array<{ id: string; name: string; component: string; textNodes: string[]; code: string }> = [];
    const singleTypes = ["Header", "Navbar", "Hero", "Section", "Footer"];
    const multipleTypes = ["Card", "Testimonial"];

    singleTypes.forEach((type) => {
      const frame = allFrames.find((f) => getComponentName(f) === type);
      if (!frame) return;
      const textNodes = collectTextNodes(frame);
      if (!textNodes.length) return;
      const uniqueName = getUniqueComponentName(type);
      sections.push({ id: frame.id, name: frame.name, component: uniqueName, textNodes, code: generateAstroCode(type, frame, textNodes, uniqueName) });
    });

    multipleTypes.forEach((type) => {
      const frames = allFrames.filter((f) => getComponentName(f) === type);
      frames.forEach((frame) => {
        const textNodes = collectTextNodes(frame);
        if (!textNodes.length) return;
        const uniqueName = getUniqueComponentName(type);
        sections.push({ id: frame.id, name: frame.name, component: uniqueName, textNodes, code: generateAstroCode(type, frame, textNodes, uniqueName) });
      });
    });

    return new Response(JSON.stringify({
      figmaURL,
      fileKey,
      totalFrames: allFrames.length,
      totalSections: sections.length,
      sections,
      embedUrl: `https://www.figma.com/embed?embed_host=astra&url=${encodeURIComponent(figmaURL)}`
    }), { status: 200, headers });

  } catch (error: any) {
    return new Response(JSON.stringify({ message: "Error", error: error.message }), { status: 500, headers });
  }
};
