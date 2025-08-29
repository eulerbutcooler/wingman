import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Find user in database
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1);

          if (!user.length) {
            return null;
          }

          const foundUser = user[0];

          // Check if email is verified
          if (!foundUser.emailVerified) {
            return null;
          }

          // Use bcrypt to verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, foundUser.password);
          
          if (!isPasswordValid) {
            return null;
          }

          return {
            id: foundUser.id,
            email: foundUser.email,
            name: foundUser.name,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/sign-in",
    signOut: "/sign-out"
  },
  events: {
    async signOut({ token }) {
      // Log signout event
      console.log("User signed out:", token?.email);
    },
    async session({ session, token }) {
      // Ensure session is properly maintained
      console.log("Session active for:", session?.user?.email);
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
