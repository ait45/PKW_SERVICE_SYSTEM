import mongoose, { Schema } from "mongoose";
const IssueReportSchema = new Schema({
    type: {
        type: String,
        enum: ["bug", "suggestion", "question", "other"],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    reportedBy: {
        type: String,
        default: "anonymous",
    },
    studentId: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: ["pending", "in_progress", "resolved", "closed"],
        default: "pending",
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "medium",
    },
    adminNote: {
        type: String,
        default: "",
    },
}, { collection: "IssueReports", timestamps: true });
const IssueReport = mongoose.models.IssueReport ||
    mongoose.model("IssueReport", IssueReportSchema);
export default IssueReport;
