import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Teacher route protection (all /teacher/* except /teacher/login)
  if (pathname.startsWith('/teacher') && pathname !== '/teacher/login') {
    const teacherToken =
      request.cookies.get('wb_teacher_session')?.value ||
      request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value

    if (!teacherToken) {
      const loginUrl = new URL('/teacher/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/teacher/:path*'],
}
