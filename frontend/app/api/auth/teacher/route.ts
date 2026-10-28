import { NextRequest, NextResponse } from 'next/server'

const DEMO_TEACHER = {
  name: 'Ms Soumya Jayakumar',
  email: 'teacher@wordbloom.edu',
  role: 'educator',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = (body.email || '').trim().toLowerCase()
    const password = (body.password || '').trim()

    // Validate credentials against demo credentials
    const isTeacher =
      (email === 'teacher@wordbloom.edu' && password === 'bloom123') ||
      (email === 'demo@wordbloom.org' && password === 'teacher123') ||
      (email.includes('@') && password === 'bloom123')

    if (!isTeacher) {
      return NextResponse.json(
        { success: false, error: 'Email or password not recognised' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({
      success: true,
      teacher: {
        name: DEMO_TEACHER.name,
        email: email,
        role: 'teacher',
      },
    })

    // Set secure authentication cookie for middleware and edge routes
    response.cookies.set('wb_teacher_session', 'authenticated', {
      path: '/',
      httpOnly: false, // Accessible to client session checks
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    })

    return response
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Signed out' })
  response.cookies.set('wb_teacher_session', '', {
    path: '/',
    maxAge: 0,
  })
  response.cookies.set('next-auth.session-token', '', {
    path: '/',
    maxAge: 0,
  })
  response.cookies.set('__Secure-next-auth.session-token', '', {
    path: '/',
    maxAge: 0,
  })
  return response
}
