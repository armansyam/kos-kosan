import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 1. Bypass check for Root/Master Account from .env
        const rootEmail = process.env.ROOT_EMAIL;
        const rootPassword = process.env.ROOT_PASSWORD;

        if (rootEmail && rootPassword && credentials.email === rootEmail && credentials.password === rootPassword) {
          return {
            id: 'root-user-ams',
            email: rootEmail,
            name: 'Super Root AMS',
            role: 'super_admin',
          };
        }

        // 2. Normal check from database
        const input = credentials.email.trim();
        let user = await prisma.user.findUnique({
          where: { email: input },
        });

        // Fallback: If input doesn't have '@', look for email starting with input + '@'
        if (!user && !input.includes('@')) {
          user = await prisma.user.findFirst({
            where: {
              email: {
                startsWith: input + '@',
              },
            },
          });
        }

        if (!user) return null;

        const isPasswordValid = await compare(credentials.password, user.password);
        if (!isPasswordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
        } as any;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
  },
};
