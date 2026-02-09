import mongoose, { Schema } from "mongoose";
const UserSchema = new Schema({
    studentId: {
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
    classes: { type: String },
    Number: { type: Number },
}, { collection: "ClientDB", timestamps: true });
const Student = mongoose.models.Student ||
    mongoose.model("Student", UserSchema);
export default Student;
