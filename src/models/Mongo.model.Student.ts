import mongoose, { Model, Schema } from "mongoose";

interface IUser {
  studentId: string | number;
  titles: string;
  name: string;
  password: string;
  isAdmin: boolean | number;
  classes: string;
  phone: string | number;

}

const UserSchema = new Schema(
  {
    studentId: {
      type: String,
      required: true,
    },
    titles: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "student",
    },
    classes: { type: String },
    Number: { type: Number },
  },
  { collection: "ClientDB", timestamps: true }
);

const Student =
  (mongoose.models.Student as Model<IUser>) ||
  mongoose.model<IUser>("Student", UserSchema);

export default Student;
