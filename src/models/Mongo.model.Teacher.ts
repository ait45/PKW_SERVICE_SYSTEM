import mongoose, { Schema, Model } from "mongoose";

interface IUser {
  teacherId: string;
  password: string;
  name: string;
  role: string;
  isAdmin: boolean;
}
const TeacherSchema = new Schema(
  {
    teacherId: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "teacher",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { collection: "TeacherDB", timestamps: true }
);
const Teacher =
  (mongoose.models.Teacher as Model<IUser>) ||
  mongoose.model<IUser>("Teacher", TeacherSchema);

export default Teacher;
