import NextAuth from 'next-auth'
import type { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Teacher Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'teacher@wordbloom.edu' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase() || ''
        const password = credentials?.password?.trim() || ''

        const isValid =
          (email === 'teacher@wordbloom.edu' && password === 'bloom123') ||
          (email === 'demo@wordbloom.org' && password === 'teacher123') ||
          (email.includes('@') && password === 'bloom123')

        if (isValid) {
          return {
            id: 't1',
            name: 'Ms. Rachel Edwards',
            email: email,
            role: 'teacher',
          } as any
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: '/teacher/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role
        token.name = user.name
      }
      return token
    },
    async session({ session, token }: any) {
      if (session?.user) {
        (session.user as any).role = token.role
        session.user.name = token.name
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'wordbloom-secret-32-characters-key-phrase!!',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
