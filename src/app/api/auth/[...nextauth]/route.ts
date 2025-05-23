import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient, Role } from "@prisma/client";
import { compare } from "bcryptjs";
import { JWT } from "next-auth/jwt";
import crypto from 'crypto';

const prisma = new PrismaClient();

// Ajouter les types pour la session
declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      email?: string;
      name?: string;
      login: string;
      role: Role;
      accessToken?: string;
    }
  }
  interface User {
    id: number;
    email?: string;
    name?: string;
    login: string;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    login: string;
    role: Role;
    accessToken?: string;
    tokenCreatedAt?: number;
  }
}

// Générer un token d'accès sécurisé
const generateAccessToken = (userId: number): string => {
  const timestamp = Date.now();
  const randomPart = crypto.randomBytes(16).toString('hex');
  return `${timestamp}.${userId}.${randomPart}`;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.prenom} ${user.nom}`,
          login: user.login,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        token.login = user.login;
        token.role = user.role;
        token.tokenCreatedAt = Date.now();

        token.accessToken = generateAccessToken(token.id);
      }

      if (token.tokenCreatedAt && Date.now() - token.tokenCreatedAt > 2 * 60 * 60 * 1000) {
        const userId = typeof token.id === 'string' ? parseInt(token.id, 10) : token.id;
        token.accessToken = generateAccessToken(userId);
        token.tokenCreatedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as number;
        session.user.login = token.login as string;
        session.user.role = token.role as Role;
        session.user.accessToken = token.accessToken;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error"
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 heures
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
