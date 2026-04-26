import { nowIso } from "@/lib/date";
import type { ProfileRecord, ProfileStatus } from "@/lib/types";

export function isMockGoogleEnabled() {
  return process.env.USE_MOCK_GOOGLE === "true" && process.env.VERCEL_ENV !== "production";
}

let mockProfiles: ProfileRecord[] | null = null;

function initialMockProfiles(): ProfileRecord[] {
  const firstSubmittedAt = nowIso();
  const secondSubmittedAt = nowIso();
  return [
    {
      queue: "01-27-04-2026",
      userAccess: "ขอเพิ่ม",
      thaiFirstName: "สมชาย",
      thaiLastName: "ใจดี",
      englishFirstName: "Somchai",
      englishLastName: "Jaidee",
      nickname: "Chai",
      organizationEmail: "somchai@example.com",
      personalEmail: "",
      creatorTypes: ["creator"],
      newscasterProgram: "",
      facebook: "somchai.profile",
      instagram: "somchai_ig",
      tiktok: "",
      x: "",
      profile: "ตัวอย่างข้อมูลสำหรับ preview หน้า admin ก่อนเชื่อม Google จริง",
      team: "Online Web",
      pictureUrl: "https://placehold.co/600x600/png",
      status: "Upload",
      listStatus: "Active",
      submittedAt: firstSubmittedAt,
      completedAt: "",
      lastUpdatedAt: firstSubmittedAt,
      statusLog: `${firstSubmittedAt}: Upload`,
      supervisorApprovedAt: "",
      supervisorEmail: "",
      isNonStaff: false,
    },
    {
      queue: "02-27-04-2026",
      userAccess: "มีแล้ว",
      thaiFirstName: "มณี",
      thaiLastName: "รักงาน",
      englishFirstName: "Manee",
      englishLastName: "Rakngan",
      nickname: "",
      organizationEmail: "",
      personalEmail: "manee@example.com",
      creatorTypes: ["newscaster"],
      newscasterProgram: "TNN Preview",
      facebook: "",
      instagram: "",
      tiktok: "manee",
      x: "",
      profile: "Non staff sample",
      team: "Outsource",
      pictureUrl: "https://placehold.co/600x600/png",
      status: "Verify",
      listStatus: "Active",
      submittedAt: secondSubmittedAt,
      completedAt: "",
      lastUpdatedAt: secondSubmittedAt,
      statusLog: `${secondSubmittedAt}: Upload\n${secondSubmittedAt}: Verify (ตัวอย่าง log)`,
      supervisorApprovedAt: "",
      supervisorEmail: "supervisor@example.com",
      isNonStaff: true,
    },
  ];
}

export function getMockProfiles(): ProfileRecord[] {
  if (!mockProfiles) mockProfiles = initialMockProfiles();
  return mockProfiles;
}

export function findMockProfile(queue: string) {
  return getMockProfiles().find((profile) => profile.queue === queue) ?? null;
}

export function appendMockProfile(record: ProfileRecord) {
  getMockProfiles().unshift(record);
}

export function deleteMockProfilesByQueues(queues: string[]) {
  const targets = new Set(queues);
  const deletedQueues = getMockProfiles()
    .filter((profile) => targets.has(profile.queue))
    .map((profile) => profile.queue);
  mockProfiles = getMockProfiles().filter((profile) => !targets.has(profile.queue));
  return deletedQueues;
}

export function updateMockProfileStatus(queue: string, status: ProfileStatus, note = "") {
  const record = findMockProfile(queue);
  if (!record) return null;
  const updatedAt = nowIso();
  const noteText = note.trim() ? ` (${note.trim()})` : "";
  const nextRecord = {
    ...record,
    status,
    completedAt: status === "Completed" ? updatedAt : record.completedAt,
    lastUpdatedAt: updatedAt,
    statusLog: `${record.statusLog}\n${updatedAt}: ${status}${noteText}`,
  };
  mockProfiles = getMockProfiles().map((profile) => (profile.queue === queue ? nextRecord : profile));
  return nextRecord;
}

export function updateMockProfileListStatus(queue: string, listStatus: "Active" | "Disable") {
  const record = findMockProfile(queue);
  if (!record) return null;
  const updatedAt = nowIso();
  const nextRecord = {
    ...record,
    listStatus,
    lastUpdatedAt: updatedAt,
    statusLog: `${record.statusLog}\n${updatedAt}: List status ${listStatus}`,
  };
  mockProfiles = getMockProfiles().map((profile) => (profile.queue === queue ? nextRecord : profile));
  return nextRecord;
}

export function updateMockProfileDetails(
  queue: string,
  input: Omit<
    ProfileRecord,
    | "queue"
    | "pictureUrl"
    | "status"
    | "listStatus"
    | "submittedAt"
    | "completedAt"
    | "lastUpdatedAt"
    | "statusLog"
    | "supervisorApprovedAt"
  >,
  pictureUrl?: string,
) {
  const record = findMockProfile(queue);
  if (!record) return null;
  if (record.status !== "Upload" && record.status !== "Verify") {
    throw new Error("This profile can no longer be edited after admin starts processing.");
  }
  const updatedAt = nowIso();
  const nextRecord = {
    ...record,
    ...input,
    pictureUrl: pictureUrl || record.pictureUrl,
    lastUpdatedAt: updatedAt,
    statusLog: `${record.statusLog}\n${updatedAt}: User edited profile`,
  };
  mockProfiles = getMockProfiles().map((profile) => (profile.queue === queue ? nextRecord : profile));
  return nextRecord;
}

function setMockSupervisorDecision(queue: string, decision: "approved" | "denied") {
  const record = findMockProfile(queue);
  if (!record) return null;
  if (!record.supervisorEmail) {
    throw new Error("This profile has no supervisor email.");
  }
  const decidedAt = nowIso();
  const decisionLabel = decision === "approved" ? "Supervisor approved" : "Supervisor denied";
  const sheetValue = decision === "approved" ? `APPROVED:${decidedAt}` : `DENIED:${decidedAt}`;
  const nextRecord = {
    ...record,
    supervisorApprovedAt: sheetValue,
    statusLog: `${record.statusLog}\n${decidedAt}: ${decisionLabel}`,
  };
  mockProfiles = getMockProfiles().map((profile) => (profile.queue === queue ? nextRecord : profile));
  return nextRecord;
}

export function approveMockProfileBySupervisor(queue: string) {
  return setMockSupervisorDecision(queue, "approved");
}

export function denyMockProfileBySupervisor(queue: string) {
  return setMockSupervisorDecision(queue, "denied");
}
