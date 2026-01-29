import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { convexQuery } from "@/lib/convexClient";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await convexQuery("users:getByEmail", { email: credentials.email });
        if (!user) {
          return null;
        }
        const valid = await compare(credentials.password, (user as any).passwordHash);
        if (!valid) {
          return null;
        }
        return {
          id: (user as any)._id,
          name: (user as any).name,
          email: (user as any).email,
          isSuperadmin: (user as any).isSuperadmin
        } as any;
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.isSuperadmin = (user as any).isSuperadmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).isSuperadmin = token.isSuperadmin;
      }
      return session;
    }
  }
};
