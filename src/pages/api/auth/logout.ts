import type { APIRoute } from "astro";
import { logoutUser } from "@/lib/appwrite";

export const POST: APIRoute = async ({ cookies }) => {
  try {
    // Logout the user from Appwrite
    await logoutUser();
    
    // Clear the session cookie
    cookies.delete("session");
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Logout successful"
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error("Logout error:", error);
    
    // Even if logout fails on the server, clear the client-side cookie
    cookies.delete("session");
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Logout completed"
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};