import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only apply to /api/generate routes
  if (request.nextUrl.pathname.startsWith('/api/generate')) {
    // If it's a GET request, redirect to POST
    if (request.method === 'GET') {
      return NextResponse.redirect(new URL('/api/generate', request.url), {
        status: 307,
        headers: {
          'Allow': 'POST',
        },
      })
    }

    // Add CORS headers for POST requests
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Methods', 'POST')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

export const config = {
  matcher: '/api/generate',
} 