import nodemailer from "nodemailer";
import type { ProfileRecord } from "@/lib/types";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  const transporter = getTransporter();
  if (!transporter) {
    if (process.env.USE_MOCK_GOOGLE === "true") return;
    throw new Error("Missing SMTP email configuration.");
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporter.sendMail({ from, to, subject, text });
}

function getRequesterEmail(record: ProfileRecord) {
  return record.organizationEmail || record.personalEmail || "-";
}

export async function sendVerifyEmail(record: ProfileRecord, note: string) {
  await sendStatusUpdateEmail(record, "Verify", note);
}

export async function sendStatusUpdateEmail(record: ProfileRecord, status: string, note: string) {
  const recipient = record.organizationEmail || record.personalEmail;
  if (!recipient) throw new Error("This profile has no email recipient.");

  const text = [
    `Queue: ${record.queue}`,
    `Name: ${record.thaiFirstName} ${record.thaiLastName}`,
    `Status: ${status}`,
    "",
    "ข้อความจาก admin:",
    note,
    "",
    "กรุณาตรวจสอบสถานะงาน หรือดำเนินการตามข้อความที่ได้รับจาก admin",
  ].join("\n");

  await sendEmail({
    to: recipient,
    subject: `Profile status update: ${record.queue} (${status})`,
    text,
  });
}

export async function sendSupervisorApprovalEmail(record: ProfileRecord, approvalUrl: string) {
  if (!record.supervisorEmail) return;

  const text = [
    "ข้อมูล request นี้ถูกบันทึกเข้าระบบ admin แล้ว",
    "",
    "กรุณากด Approve เพื่อยืนยันว่า บุคคลดังต่อไปนี้ เป็นบุคลากรในบังคับบัญชา",
    "",
    `Queue: ${record.queue}`,
    `Name: ${record.thaiFirstName} ${record.thaiLastName}`,
    `Team: ${record.team || "-"}`,
    `email: ${getRequesterEmail(record)}`,
    "",
    approvalUrl,
    "",
    "หากไม่ใช่กรุณากด Deny",
  ].join("\n");

  await sendEmail({
    to: record.supervisorEmail,
    subject: `Supervisor approval request: ${record.queue}`,
    text,
  });
}
