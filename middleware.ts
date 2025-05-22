import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only apply to /api/generate routes
  if (request.nextUrl.pathname.startsWith('/api/generate')) {
    // Log the request method and headers
    console.log('Middleware - Request method:', request.method);
    console.log('Middleware - Request headers:', Object.fromEntries(request.headers.entries()));

    // If it's a GET request, return 405 immediately
    if (request.method === 'GET') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { 
          status: 405,
          headers: {
            'Allow': 'POST',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          }
        }
      );
    }

    // For POST requests, add CORS headers
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Methods', 'POST');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }
}

export const config = {
  matcher: '/api/generate',
} 