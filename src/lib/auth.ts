import NextAuth, { CredentialsSignin } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBConnection } from "./config.mongoDB";
import Student from "../models/Mongo.model.Student";
import Teacher from "../models/Mongo.model.Teacher";
import bcrypt from "bcrypt";
import type { ObjectId } from "mongoose";
import { NextResponse } from "next/server";

const statusDevelopment = process.env.NODE_ENV;
// show Error Message
class AuthError extends CredentialsSignin {
  constructor(message: string) {
    super(message);
    this.code = message;
  }
}

interface UserDocument {
  _id: ObjectId;
  studentId: string;
  teacherId: string;
  password: string;
  isAdmin: boolean;
  role: string;
  name: string;
}
type Credentials = {
  username: string;
  password: string;
};
export const { handlers, auth, signIn, signOut } = NextAuth({
  // function Process Username and Password
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { username, password } = credentials as Credentials;
        if (!username || !password) {
          throw new AuthError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
        }
        try {
          await MongoDBConnection();
          // console.log("DB Connected for Auth");

          if (username.startsWith("T")) {
            const user: UserDocument | null =
              await Teacher.findOne<UserDocument>({
                teacherId: username,
              });

            if (!user) {
              console.log("Teacher not found:", username);
              throw new AuthError("ชื่อผู้ใช้ไม่ถูกต้อง");
            }

            console.log(user);

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
              console.log("Invalid password for teacher:", username);
              throw new AuthError("รหัสผ่านไม่ถูกต้อง");
            }
            return {
              id: user._id.toString(),
              username: user.teacherId,
              name: user.name,
              role: user.role || "teacher",
              isAdmin: user.isAdmin,
            };
          } else if (username === process.env.USER_LOGIN){
            if (password === process.env.PASS_LOGIN) {
              return {
              id: "1",
              username: process.env.USER_LOGIN,
              name: "Admin",
              role: "teacher",
              isAdmin: true,
            }
          } else {
            throw new AuthError("ชื่อผู้ใช้ไม่ถูกต้อง");
            }
          } else {
            // Pad leading zeros ให้ครบ 5 หลัก เพื่อรองรับ studentId ที่มี 0 นำหน้า
            const paddedUsername = username.padStart(5, '0');
            
            const user: UserDocument | null =
              await Student.findOne<UserDocument>({
                studentId: paddedUsername,
              });

            if (!user) {
              console.log("Student not found:", username);
              throw new AuthError("ชื่อผู้ใช้ไม่ถูกต้อง");
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
              console.log("Invalid password for student:", username);
              throw new AuthError("รหัสผ่านไม่ถูกต้อง");
            }

            return {
              id: user._id.toString(),
              username: user.studentId,
              name: user.name,
              role: user.role,
              isAdmin: user.isAdmin,
            };
          }
        } catch (error) {
          console.error("Auth Error:", error);
          if (error instanceof AuthError) {
            throw error;
          }
          if (error instanceof Error) {
            if (
              error.message.includes("buffering timed out") ||
              error.message.includes("ECONNREFUSED") ||
              error.message.includes("ETIMEDOUT")
            ) {
              throw new AuthError(
                "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล กรุณาลองใหม่",
              );
            }
            throw error;
          }
          throw new AuthError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 30,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        ((token.id = user.id),
          (token.username = user.username),
          (token.name = user.name));
        token.isAdmin = user.isAdmin;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      ((session.id = token.id as string),
        (session.user.username = token.username as string),
        (session.user.name = token.name as string));
      session.user.role = token.role as string;
      session.user.isAdmin = token.isAdmin as boolean;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // ป้องกันการ reload หลายหน้า
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;

      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
});
