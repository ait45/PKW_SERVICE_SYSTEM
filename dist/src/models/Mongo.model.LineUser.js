import mongoose, { Schema } from "mongoose";
const LineUserSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    displayName: {
        type: String,
        default: "",
    },
    pictureUrl: {
        type: String,
        default: "",
    },
    statusMessage: {
        type: String,
        default: "",
    },
    role: {
        type: String,
        enum: ["admin", "teacher", "student", "parent", "other"],
        default: "other",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    note: {
        type: String,
        default: "",
    },
    addedBy: {
        type: String,
        default: "system",
    },
}, { collection: "LineUsers", timestamps: true });
const LineUser = mongoose.models.LineUser ||
    mongoose.model("LineUser", LineUserSchema);
export default LineUser;
