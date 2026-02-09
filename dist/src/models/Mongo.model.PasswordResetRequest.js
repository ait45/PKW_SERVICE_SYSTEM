import mongoose, { Schema } from "mongoose";
const PasswordResetRequestSchema = new Schema({
    studentId: {
        type: String,
        required: true,
    },
    studentName: {
        type: String,
        default: "",
    },
    classes: {
        type: String,
        default: "",
    },
    reason: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: ["pending", "acknowledged", "resolved"],
        default: "pending",
    },
    acknowledgedBy: {
        type: String,
        default: "",
    },
    acknowledgedAt: {
        type: Date,
        default: null,
    },
    note: {
        type: String,
        default: "",
    },
}, { collection: "PasswordResetRequests", timestamps: true });
const PasswordResetRequest = mongoose.models.PasswordResetRequest ||
    mongoose.model("PasswordResetRequest", PasswordResetRequestSchema);
export default PasswordResetRequest;
