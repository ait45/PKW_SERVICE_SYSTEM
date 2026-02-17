import { messagingApi } from "@line/bot-sdk";
import * as fs from "fs";
import * as path from "path";
import { MongoDBConnection } from "@/lib/config.mongoDB";
import LineLog from "@/models/Mongo.model.LineLog";

// Types are exported from the main package
type FlexMessage = messagingApi.FlexMessage;
type FlexBubble = messagingApi.FlexBubble;

// ตั้งค่า LINE Messaging API Client (ใช้แบบใหม่)
const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
});

// Interface สำหรับข้อมูลสรุปการเข้าเรียน
export interface AttendanceSummaryData {
  date: string;
  totalm1: number;
  t1: number;
  f1: number;
  totalm2: number;
  t2: number;
  f2: number;
  totalm3: number;
  t3: number;
  f3: number;
  totalm4: number;
  t4: number;
  f4: number;
  totalm5: number;
  t5: number;
  f5: number;
  totalm6: number;
  t6: number;
  f6: number;
  totalPresent: number;
  totalAbsent: number;
  percentage: string;
}

// Interface สำหรับ log data
interface LogData {
  messageType: "push" | "broadcast" | "multicast";
  recipientType?: string;
  recipientId?: string;
  recipientCount?: number;
  altText: string;
  status: "success" | "failed" | "pending";
  errorMessage?: string;
  sentBy?: string;
}

// ฟังก์ชันบันทึก log ลง MongoDB
const saveLineLog = async (logData: LogData): Promise<void> => {
  try {
    await MongoDBConnection();
    await LineLog.create({
      messageType: logData.messageType,
      recipientType: logData.recipientType || "user",
      recipientId: logData.recipientId || "",
      recipientCount: logData.recipientCount || 1,
      messageContent: "",
      altText: logData.altText,
      status: logData.status,
      errorMessage: logData.errorMessage || "",
      sentBy: logData.sentBy || "system",
    });
    console.log("บันทึก log สำเร็จ");
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการบันทึก log:", error);
  }
};

// ฟังก์ชัน helper สำหรับแทนที่ตัวแปรใน template
const replaceTemplateVariables = (
  template: string,
  data: AttendanceSummaryData,
): string => {
  let result = template;

  // แทนที่ทุก ${data.xxx} ด้วยค่าจริง
  result = result.replace(/\$\{data\.date\}/g, data.date);
  result = result.replace(/\$\{data\.totalm1\}/g, String(data.totalm1));
  result = result.replace(/\$\{data\.t1\}/g, String(data.t1));
  result = result.replace(/\$\{data\.f1\}/g, String(data.f1));
  result = result.replace(/\$\{data\.totalm2\}/g, String(data.totalm2));
  result = result.replace(/\$\{data\.t2\}/g, String(data.t2));
  result = result.replace(/\$\{data\.f2\}/g, String(data.f2));
  result = result.replace(/\$\{data\.totalm3\}/g, String(data.totalm3));
  result = result.replace(/\$\{data\.t3\}/g, String(data.t3));
  result = result.replace(/\$\{data\.f3\}/g, String(data.f3));
  result = result.replace(/\$\{data\.totalm4\}/g, String(data.totalm4));
  result = result.replace(/\$\{data\.t4\}/g, String(data.t4));
  result = result.replace(/\$\{data\.f4\}/g, String(data.f4));
  result = result.replace(/\$\{data\.totalm5\}/g, String(data.totalm5));
  result = result.replace(/\$\{data\.t5\}/g, String(data.t5));
  result = result.replace(/\$\{data\.f5\}/g, String(data.f5));
  result = result.replace(/\$\{data\.totalm6\}/g, String(data.totalm6));
  result = result.replace(/\$\{data\.t6\}/g, String(data.t6));
  result = result.replace(/\$\{data\.f6\}/g, String(data.f6));
  result = result.replace(
    /\$\{data\.totalPresent\}/g,
    String(data.totalPresent),
  );
  result = result.replace(/\$\{data\.totalAbsent\}/g, String(data.totalAbsent));
  result = result.replace(/\$\{data\.percentage\}/g, data.percentage);

  return result;
};

// โหลด template จากไฟล์ JSON
const loadFlexTemplate = (): string => {
  const templatePath = path.join(
    process.cwd(),
    "src",
    "utils",
    "template_flex_message.json",
  );
  return fs.readFileSync(templatePath, "utf-8");
};

// สร้าง Flex Message จาก JSON template
export const createAttendanceSummaryFlexMessage = (
  data: AttendanceSummaryData,
): FlexMessage => {
  // โหลด template
  const templateString = loadFlexTemplate();

  // แทนที่ตัวแปร
  const filledTemplate = replaceTemplateVariables(templateString, data);

  // Parse เป็น FlexBubble
  const bubble: FlexBubble = JSON.parse(filledTemplate);

  return {
    type: "flex",
    altText: `สรุปการเข้าเรียน วันที่ ${data.date}`,
    contents: bubble,
  };
};

// ฟังก์ชันส่ง Flex Message (Push Message)
export const sendFlexMessage = async (
  userId: string,
  flexMessage: FlexMessage,
  sentBy?: string,
): Promise<void> => {
  try {
    await lineClient.pushMessage({
      to: userId,
      messages: [flexMessage],
    });
    console.log("ส่ง Flex Message สำเร็จ");

    // บันทึก log
    await saveLineLog({
      messageType: "push",
      recipientType: "user",
      recipientId: userId,
      recipientCount: 1,
      altText: flexMessage.altText,
      status: "success",
      sentBy: sentBy,
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการส่ง:", error);

    // บันทึก log error
    await saveLineLog({
      messageType: "push",
      recipientType: "user",
      recipientId: userId,
      recipientCount: 1,
      altText: flexMessage.altText,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
      sentBy: sentBy,
    });

    throw error;
  }
};

// ฟังก์ชัน broadcast ส่งถึงทุกคน
export const broadcastFlexMessage = async (
  flexMessage: FlexMessage,
  sentBy?: string,
): Promise<void> => {
  try {
    await lineClient.broadcast({
      messages: [flexMessage],
    });
    console.log("Broadcast Flex Message สำเร็จ");

    // บันทึก log
    await saveLineLog({
      messageType: "broadcast",
      recipientType: "all",
      recipientId: "all",
      altText: flexMessage.altText,
      status: "success",
      sentBy: sentBy,
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการ broadcast:", error);

    // บันทึก log error
    await saveLineLog({
      messageType: "broadcast",
      recipientType: "all",
      recipientId: "all",
      altText: flexMessage.altText,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
      sentBy: sentBy,
    });

    throw error;
  }
};

// ฟังก์ชันส่งหลายคนพร้อมกัน (Multicast)
export const multicastFlexMessage = async (
  userIds: string[],
  flexMessage: FlexMessage,
  sentBy?: string,
): Promise<void> => {
  try {
    await lineClient.multicast({
      to: userIds,
      messages: [flexMessage],
    });
    console.log("Multicast Flex Message สำเร็จ");

    // บันทึก log
    await saveLineLog({
      messageType: "multicast",
      recipientType: "users",
      recipientId: userIds.join(","),
      recipientCount: userIds.length,
      altText: flexMessage.altText,
      status: "success",
      sentBy: sentBy,
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการ multicast:", error);

    // บันทึก log error
    await saveLineLog({
      messageType: "multicast",
      recipientType: "users",
      recipientId: userIds.join(","),
      recipientCount: userIds.length,
      altText: flexMessage.altText,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
      sentBy: sentBy,
    });

    throw error;
  }
};

// ฟังก์ชันส่ง Flex Message ไปยังกลุ่ม (Group)
export const sendFlexMessageToGroup = async (
  groupId: string,
  flexMessage: FlexMessage,
  sentBy?: string,
): Promise<void> => {
  try {
    await lineClient.pushMessage({
      to: groupId,
      messages: [flexMessage],
    });
    console.log("ส่ง Flex Message ไปยังกลุ่มสำเร็จ");

    // บันทึก log
    await saveLineLog({
      messageType: "push",
      recipientType: "group",
      recipientId: groupId,
      recipientCount: 1,
      altText: flexMessage.altText,
      status: "success",
      sentBy: sentBy,
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการส่งไปยังกลุ่ม:", error);

    // บันทึก log error
    await saveLineLog({
      messageType: "push",
      recipientType: "group",
      recipientId: groupId,
      recipientCount: 1,
      altText: flexMessage.altText,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
      sentBy: sentBy,
    });

    throw error;
  }
};

// ตัวอย่างการใช้งาน
// สร้างข้อมูลสรุป
// const summaryData: AttendanceSummaryData = {
//   date: "29 ม.ค. 2569",
//   totalm1: 120, t1: 115, f1: 5,
//   totalm2: 110, t2: 108, f2: 2,
//   totalm3: 100, t3: 95, f3: 5,
//   totalm4: 90, t4: 88, f4: 2,
//   totalm5: 85, t5: 80, f5: 5,
//   totalm6: 80, t6: 78, f6: 2,
//   totalPresent: 564,
//   totalAbsent: 21,
//   percentage: "96.41"
// };
// const message = createAttendanceSummaryFlexMessage(summaryData);
// await broadcastFlexMessage(message, "admin");
