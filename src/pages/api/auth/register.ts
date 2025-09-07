import type { APIRoute } from "astro";
import { registerUser } from "@/lib/appwrite";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const firstName = formData.get("firstName")?.toString();
    const lastName = formData.get("lastName")?.toString();

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ 
          error: "All fields are required" 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ 
          error: "Please enter a valid email address" 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ 
          error: "Password must be at least 8 characters long" 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Register the user
    const user = await registerUser(email, password, firstName, lastName);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Account created successfully",
        userId: user.$id
      }),
      { 
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error("Registration error:", error);
    
    // Handle specific Appwrite errors
    if (error.code === 409) {
      return new Response(
        JSON.stringify({ 
          error: "An account with this email already exists" 
        }),
        { 
          status: 409,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    if (error.code === 400) {
      return new Response(
        JSON.stringify({ 
          error: error.message || "Invalid registration data" 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: "Registration failed. Please try again." 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};