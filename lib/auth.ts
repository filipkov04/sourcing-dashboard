import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { organization: true },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
          avatarId: user.avatarId,
          projectId: null,
          projectName: null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.avatarId = user.avatarId ?? null;
        token.projectId = null;
        token.projectName = null;
      }
      // Always refresh role and org from DB so changes take effect without re-login
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              name: true,
              role: true,
              organizationId: true,
              avatarId: true,
              organization: { select: { name: true } },
              activeProjectId: true,
              activeProject: { select: { name: true } },
            },
          });
          if (dbUser) {
            token.name = dbUser.name;
            token.role = dbUser.role;
            token.organizationId = dbUser.organizationId;
            token.organizationName = dbUser.organization.name;
            token.avatarId = dbUser.avatarId ?? null;
            token.projectId = dbUser.activeProjectId ?? null;
            token.projectName = dbUser.activeProject?.name ?? null;
          }
        } catch {
          // DB unavailable — keep existing token values rather than breaking the session
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationName = token.organizationName as string;
        session.user.avatarId = token.avatarId as string | null;
        session.user.projectId = (token.projectId as string) ?? null;
        session.user.projectName = (token.projectName as string) ?? null;
      }
      return session;
    },
  },
});
