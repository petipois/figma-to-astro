import type { APIRoute } from "astro";
import { resetCredits } from "@/lib/appwrite";

const SITE_ORIGIN = "https://figstro.appwrite.network";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": SITE_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

// CORS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const userID = formData.get("userID")?.toString();

    if (!userID) {
      return new Response(
        JSON.stringify({ success: false, message: "User ID is required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        }
      );
    }

    // Reset the credits
    await resetCredits(userID);

    // Redirect back to the demo page
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/demo",
        ...CORS_HEADERS,
      },
    });
  } catch (error) {
    console.error("Error resetting credits:", error);

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/demo",
        ...CORS_HEADERS,
      },
    });
  }
};
