import NextAuth, { CredentialsSignin } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBConnection } from "./config.mongoDB";
import Student from "../models/Mongo.model.Student";
import Teacher from "../models/Mongo.model.Teacher";
import bcrypt from "bcrypt";
const statusDevelopment = process.env.NODE_ENV;
// show Error Message
class AuthError extends CredentialsSignin {
    constructor(message) {
        super(message);
        this.code = message;
    }
}
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
                if (statusDevelopment === "development") {
                    return {
                        id: "1",
                        username: "admin",
                        name: "Admin",
                        role: "teacher",
                        isAdmin: true,
                    };
                }
                const { username, password } = credentials;
                if (!username || !password) {
                    throw new AuthError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
                }
                try {
                    await MongoDBConnection();
                    // console.log("DB Connected for Auth");
                    if (username.startsWith("T")) {
                        const user = await Teacher.findOne({
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
                            role: user.role,
                            isAdmin: user.isAdmin,
                        };
                    }
                    else {
                        const user = await Student.findOne({
                            studentId: username,
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
                }
                catch (error) {
                    console.error("Auth Error:", error);
                    if (error instanceof AuthError) {
                        throw error;
                    }
                    if (error instanceof Error) {
                        if (error.message.includes("buffering timed out") ||
                            error.message.includes("ECONNREFUSED") ||
                            error.message.includes("ETIMEDOUT")) {
                            throw new AuthError("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล กรุณาลองใหม่");
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
            ((session.id = token.id),
                (session.user.username = token.username),
                (session.user.name = token.name));
            session.user.role = token.role;
            session.user.isAdmin = token.isAdmin;
            return session;
        },
        async redirect({ url, baseUrl }) {
            // ป้องกันการ reload หลายหน้า
            if (url.startsWith("/"))
                return `${baseUrl}${url}`;
            if (url.startsWith(baseUrl))
                return url;
            return baseUrl;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/login",
    },
});
