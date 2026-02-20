import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Health check is public — Railway healthcheck does not send secret
  if (request.nextUrl.pathname === '/api/health') {
    return NextResponse.next()
  }

  // Only protect /api/* routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Validate x-laura-secret header
  if (request.headers.get('x-laura-secret') !== process.env.LAURA_API_SECRET) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return NextResponse.next()
}

export const config = { matcher: ['/api/:path*'] }
