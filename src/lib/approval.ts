import { createHmac, timingSafeEqual } from "node:crypto";

function getApprovalSecret() {
  return process.env.SUPERVISOR_APPROVAL_SECRET || process.env.ADMIN_PASSWORD || "local-approval-secret";
}

export function createSupervisorApprovalToken(queue: string) {
  return createHmac("sha256", getApprovalSecret()).update(queue).digest("hex");
}

export function isSupervisorApprovalTokenValid(queue: string, token: string) {
  const expected = createSupervisorApprovalToken(queue);
  const expectedBuffer = Buffer.from(expected, "hex");
  const tokenBuffer = Buffer.from(token, "hex");

  if (expectedBuffer.length !== tokenBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, tokenBuffer);
}

export function createSupervisorApprovalUrl(origin: string, queue: string) {
  const token = createSupervisorApprovalToken(queue);
  return `${origin.replace(/\/$/, "")}/approve/${encodeURIComponent(queue)}?token=${token}`;
}
