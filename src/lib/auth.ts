import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
// import WeChatProvider from 'next-auth/providers/wechat'
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/auth";
import { ACTIVE_SENTINEL } from "@/lib/constants";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 90 * 24 * 60 * 60, // 90 天（秒）
  },
  jwt: {
    maxAge: 90 * 24 * 60 * 60, // 90 天（秒）
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: {
            email_deletedAt: {
              email,
              deletedAt: ACTIVE_SENTINEL, // 哨兵时间表示未删除
            },
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        // 检查用户状态
        if (user.status !== "ACTIVE") {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    // 微信登录需要企业微信或微信开放平台账号
    // WeChatProvider({
    //   clientId: process.env.WECHAT_CLIENT_ID!,
    //   clientSecret: process.env.WECHAT_CLIENT_SECRET!,
    // }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: updatedSession }) {
      if (user) {
        token.id = user.id;
      }

      // 主动更新（如前端 update 调用）时，写回新的 avatar
      if (trigger === "update" && updatedSession?.user) {
        if (updatedSession.user.avatar !== undefined) {
          token.avatar = updatedSession.user.avatar;
        }
        if (updatedSession.user.name !== undefined) {
          token.name = updatedSession.user.name;
        }
      }

      // 补充用户角色、头像等信息，确保 session 接口返回完整字段
      if (
        token.id &&
        (!token.role || !token.avatar || !token.phone || !token.status)
      ) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            avatar: true,
            phone: true,
            status: true,
          },
        });

        if (dbUser) {
          token.role = dbUser.role ?? undefined;
          token.avatar = dbUser.avatar ?? undefined;
          token.phone = dbUser.phone ?? undefined;
          token.status = dbUser.status ?? undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.avatar = token.avatar;
        session.user.phone = token.phone;
        session.user.status = token.status;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
