import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // MOCK AUTH: Always return a dummy user
        // In production, verify against DB
        return {
          id: "mock-user-id",
          name: "Test User",
          email: credentials?.email as string || "test@example.com",
          image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = "mock-user-id"
      }
      return session
    },
  },
  session: { strategy: "jwt" } // Required for CredentialsProvider
})
