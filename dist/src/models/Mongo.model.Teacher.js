import mongoose, { Schema } from "mongoose";
const TeacherSchema = new Schema({
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
    isAdmin: {
        type: Boolean,
        default: false,
    },
}, { collection: "TeacherDB", timestamps: true });
const Teacher = mongoose.models.Teacher ||
    mongoose.model("Teacher", TeacherSchema);
export default Teacher;
