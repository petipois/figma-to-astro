import type { APIRoute } from "astro";
import { resetCredits } from "@/lib/appwrite";

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const formData = await request.formData();
    const userID = formData.get("userID")?.toString();

    if (!userID) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "User ID is required" 
        }), 
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Reset the credits
    await resetCredits(userID);

    // Redirect back to the demo page after successful reset
    return redirect("/demo", 302);

  } catch (error) {
    console.error("Error resetting credits:", error);
    
    // You could redirect to an error page or back to demo with error
    return redirect("/demo?error=reset_failed", 302);
  }
};