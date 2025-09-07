import { defineMiddleware } from "astro/middleware";
import { account } from "./lib/appwrite";

export const onRequest = defineMiddleware(async ({ url, locals, redirect }, next) => {
  // Initialize user as null
  locals.user = null;

  try {
    // Try to get the current user from Appwrite
    const user = await account.get();
    locals.user = user;
  } catch (error) {
    locals.user = null;
  }

  // Routes requiring login
  const protectedRoutes = ['/converter', '/dashboard', '/profile'];
  const authRoutes = ['/login', '/register'];

  const path = url.pathname; // ensure pathname is correct

  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isAuthRoute = authRoutes.some(route => path.startsWith(route));

  // If logged in and visiting login/register, redirect to /converter
  if (locals.user && isAuthRoute) {
    return redirect('/converter', 307);
  }

  // If not logged in and visiting protected route, redirect to /login
  if (!locals.user && isProtectedRoute) {
    return redirect('/login', 307);
  }

  // Continue normally
  return next();
});
