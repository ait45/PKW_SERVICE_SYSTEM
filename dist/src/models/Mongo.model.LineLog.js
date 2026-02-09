import mongoose, { Schema } from "mongoose";
const LineLogSchema = new Schema({
    messageType: {
        type: String,
        enum: ["push", "broadcast", "multicast"],
        required: true,
    },
    recipientType: {
        type: String,
        default: "user",
    },
    recipientId: {
        type: String,
        default: "",
    },
    recipientCount: {
        type: Number,
        default: 1,
    },
    messageContent: {
        type: String,
        default: "",
    },
    altText: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: ["success", "failed", "pending"],
        required: true,
    },
    errorMessage: {
        type: String,
        default: "",
    },
    sentBy: {
        type: String,
        default: "system",
    },
}, { collection: "LineMessageLogs", timestamps: true });
const LineLog = mongoose.models.LineLog ||
    mongoose.model("LineLog", LineLogSchema);
export default LineLog;
