import type { APIRoute } from "astro";
import { loginUser } from "@/lib/appwrite";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "https://figstro.appwrite.network", // your frontend origin
    "Access-Control-Allow-Credentials": "true",
  };
    // Login the user
    const session = await loginUser(email, password);

    // Set session cookie
    cookies.set("session", session.$id, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Redirect to home page after successful login
    return new Response(null, {
      status: 307, // Temporary redirect
      headers: {
        Location: "/converter", // Home page
      },
    });

  } catch (error: any) {
    console.error("Login error:", error);

    if (error.code === 401) {
      return new Response(
        JSON.stringify({ error: "Invalid email or password" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error.code === 400) {
      return new Response(
        JSON.stringify({ error: error.message || "Invalid login data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Login failed. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
