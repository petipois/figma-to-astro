import type { APIRoute } from "astro";

const FIGMA_TOKEN = import.meta.env.FIGMA_ACCESS_TOKEN;

// Single-instance components (only one instance allowed)
const singleTypes = new Set([
  "Hero",
  "Navbar",
  "Header",
  "Footer",
  "Section",
  "CTA",
  "AboutUs",
  "Newsletter",
  "Card",
  "Blog",
  "Testimonial",
]);

// Multi-instance components
const multiTypes = new Set(["Gallery"]);

// Unique component naming
const getUniqueComponentName = (() => {
  const counters: Record<string, number> = {};
  return (baseName: string) => {
    counters[baseName] = (counters[baseName] || 0) + 1;
    return counters[baseName] > 1 ? `${baseName}${counters[baseName]}` : baseName;
  };
})();

// Recursively collect text nodes
const collectTextNodes = (node: any): string[] => {
  const texts: string[] = [];
  if (!node) return texts;
  if (node.type === "TEXT" && node.characters) texts.push(node.characters);
  node.children?.forEach((child: any) => texts.push(...collectTextNodes(child)));
  return texts;
};

// Flatten frames recursively
const flattenFrames = (node: any, frames: any[] = []) => {
  if (!node) return frames;
  if (node.type === "FRAME") frames.push(node);
  node.children?.forEach((child: any) => flattenFrames(child, frames));
  return frames;
};

// Detect component type by frame name or children
const getComponentType = (frame: any) => {
  const name = frame.name.toLowerCase();
  if (name.includes("hero")) return "Hero";
  if (name.includes("navbar") || name.includes("header")) return "Navbar";
  if (name.includes("footer")) return "Footer";
  if (name.includes("testimonial")) return "Testimonial";
  if (name.includes("gallery") || frame.children?.some((c: any) => c.type === "IMAGE")) return "Gallery";
  if (name.includes("card") || name.includes("product")) return "Card";
  if (name.includes("cta")) return "CTA";
  if (name.includes("about")) return "AboutUs";
  if (name.includes("newsletter")) return "Newsletter";
  if (name.includes("blog")) return "Blog";
  return "Section";
};

// Generate Astro code templates
const generateAstroCode = (type: string, frame: any, textNodes: string[]) => {
  const text = textNodes.join(" ");
  switch (type) {
    case "Hero":
      return `---\nconst { title="${text}", buttonText="Call To Action", buttonLink="#" } = Astro.props;\n---\n<section class="hero">\n  <h1>{title}</h1>\n  <a href={buttonLink}>{buttonText}</a>\n</section>`;
    case "Navbar":
      return `---\nconst { navList=["Home","About","Contact"] } = Astro.props;\n---\n<nav>\n  <ul>{navList.map(item => (<li>{item}</li>))}</ul>\n</nav>`;
    case "Footer":
      return `---\nconst year = new Date().getFullYear();\n---\n<footer>\n  <p>${text} | © {year}</p>\n</footer>`;
    case "Gallery":
      return `---\nconst { images=["image1.jpg","image2.jpg"] } = Astro.props;\n---\n<div class="gallery">\n  {images.map(src => (<img src={src} alt="Gallery Image"/>))}\n</div>`;
    case "AboutUs":
      return `---\nconst { content="${text}" } = Astro.props;\n---\n<section class="about-us">\n  <h2>About Us</h2>\n  <p>{content}</p>\n</section>`;
    case "Newsletter":
      return `---\nconst { title="${text}" } = Astro.props;\n---\n<section class="newsletter">\n  <h2>{title}</h2>\n  <form><input placeholder="Your email"/><button>Subscribe</button></form>\n</section>`;
    case "Blog":
      return `---\nconst { posts=["Post 1","Post 2"] } = Astro.props;\n---\n<section class="blog">\n  {posts.map(post => (<article><h3>{post}</h3></article>))}\n</section>`;
    case "Card":
    case "Testimonial":
    case "CTA":
    default:
      return `---\nconst { text="${text}" } = Astro.props;\n---\n<section class="${type.toLowerCase()}">\n  <p>{text}</p>\n</section>`;
  }
};

export const POST: APIRoute = async ({ request }) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

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

    const allFrames = flattenFrames(fileData.document);
    const sections: Array<{ id: string; name: string; component: string; code: string }> = [];
    const addedTypes = new Set<string>();

    for (const frame of allFrames) {
      const type = getComponentType(frame);

      // Skip duplicates for single-instance components, including Card, Blog, Testimonial
      if (singleTypes.has(type) && addedTypes.has(type)) continue;

      const textNodes = collectTextNodes(frame);
      if (!textNodes.length && type !== "Gallery") continue;

      const componentName = `${type}${addedTypes.has(type) ? addedTypes.size+1 : ""}`;
      const code = generateAstroCode(type, frame, textNodes);

      sections.push({
        id: frame.id,
        name: frame.name,
        component: componentName,
        code
      });

      addedTypes.add(type);
    }

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
