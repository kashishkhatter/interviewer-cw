import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// List of public routes that don't require authentication
const publicRoutes = ["/", "/sign-in", "/sign-up", "/api/auth/verify", "/api/webhook/clerk"];

export default async function middleware(request) {
  // Allow API routes and static files
  if (request.nextUrl.pathname.startsWith('/api/') || 
      request.nextUrl.pathname.match(/(api|_next|fonts|images|static)/)) {
    return NextResponse.next();
  }

  // For public routes, allow access
  if (publicRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Check for JWT token in cookie
  const token = request.cookies.get('jwt_token');
  
  if (token) {
    // If we have a token, let the request through
    // The server-side API will handle verification
    return NextResponse.next();
  }

  // If no JWT token, use Clerk authentication
  return authMiddleware({
    publicRoutes
  })(request);
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};