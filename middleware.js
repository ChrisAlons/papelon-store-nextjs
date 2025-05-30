import { withAuth } from "next-auth/middleware"

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    // You can add additional middleware logic here if needed
    console.log("🔐 Middleware executed for:", req.nextUrl.pathname)
    console.log("👤 User token:", req.nextauth.token)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to login page always
        if (pathname.startsWith('/login')) {
          return true
        }
        
        // Protect dashboard and API routes - require authentication
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/api')) {
          return !!token // Returns true if token exists, false otherwise
        }
        
        // Allow other routes
        return true
      },
    },
    pages: {
      signIn: "/login", // Redirect to login page when not authenticated
    },
  }
)

// Configure which routes should be protected
export const config = {
  matcher: [
    // Protect all dashboard routes
    '/dashboard/:path*',
    // Protect all API routes except auth
    '/api/((?!auth).)*',
    // You can add more specific patterns here
  ]
}
