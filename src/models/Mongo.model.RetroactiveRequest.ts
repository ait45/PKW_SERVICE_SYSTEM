import mongoose, { Schema, Model } from "mongoose";

interface IChangeItem {
  studentId: string;
  name: string;
  classes: string;
  status: string;
  isFirstRecord: boolean; // true = ยังไม่มีเช็คชื่อวันนั้น, false = แก้ไขสถานะเดิม
}

interface IRetroactiveRequest {
  requestedBy: string;
  requestedByName: string;
  targetDate: Date;
  changes: IChangeItem[];
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  rejectReason?: string;
}

const ChangeItemSchema = new Schema(
  {
    studentId: { type: String, required: true },
    name: { type: String, required: true },
    classes: { type: String, required: true },
    status: { type: String, required: true },
    isFirstRecord: { type: Boolean, required: true },
  },
  { _id: false },
);

const RetroactiveRequestSchema = new Schema(
  {
    requestedBy: { type: String, required: true },
    requestedByName: { type: String, required: true },
    targetDate: { type: Date, required: true },
    changes: { type: [ChangeItemSchema], required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: { type: String },
    reviewedByName: { type: String },
    reviewedAt: { type: Date },
    rejectReason: { type: String },
  },
  { collection: "RetroactiveRequests", timestamps: true },
);

const RetroactiveRequest =
  (mongoose.models.RetroactiveRequest as Model<IRetroactiveRequest>) ||
  mongoose.model<IRetroactiveRequest>(
    "RetroactiveRequest",
    RetroactiveRequestSchema,
  );

export default RetroactiveRequest;
export type { IRetroactiveRequest, IChangeItem };
