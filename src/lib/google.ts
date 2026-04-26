import { Readable } from "node:stream";
import { google, sheets_v4 } from "googleapis";
import { DRIVE_FOLDER_ID, SHEET_ID, SHEET_NAME } from "@/lib/config";
import { getBangkokDateParts, nowIso } from "@/lib/date";
import type { CreatorType, ListStatus, ProfileRecord, ProfileStatus, UserAccess } from "@/lib/types";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

let authClient: InstanceType<typeof google.auth.JWT> | null = null;
let sheetsClient: sheets_v4.Sheets | null = null;
let sheetNumericId: number | null = null;

type ProfileWithRow = {
  record: ProfileRecord;
  rowNumber: number;
};

type GithubProfilesFile = {
  records?: Partial<ProfileRecord>[];
  updatedAt?: string;
};

function getServiceAccount() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) {
    return JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64, "base64").toString("utf8"),
    ) as { client_email: string; private_key: string };
  }

  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON) as {
      client_email: string;
      private_key: string;
    };
  }

  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  throw new Error("Missing Google service account credentials.");
}

function getAuthClient() {
  if (!authClient) {
    const serviceAccount = getServiceAccount();
    authClient = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: SCOPES,
    });
  }
  return authClient;
}

function getSheetsClient() {
  if (!sheetsClient) {
    sheetsClient = google.sheets({ version: "v4", auth: getAuthClient() });
  }
  return sheetsClient;
}

function getDriveClient() {
  return google.drive({ version: "v3", auth: getAuthClient() });
}

async function getSheetNumericId() {
  if (sheetNumericId !== null) return sheetNumericId;

  const response = await getSheetsClient().spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: "sheets(properties(sheetId,title))",
  });
  const sheet = response.data.sheets?.find((item) => item.properties?.title === SHEET_NAME);
  const id = sheet?.properties?.sheetId;
  if (id === undefined || id === null) {
    throw new Error(`Sheet tab not found: ${SHEET_NAME}`);
  }
  sheetNumericId = id;
  return id;
}

function rowToRecord(row: string[]): ProfileRecord {
  return {
    queue: row[0] ?? "",
    userAccess: parseUserAccess(row[26]),
    thaiFirstName: row[1] ?? "",
    thaiLastName: row[2] ?? "",
    englishFirstName: row[3] ?? "",
    englishLastName: row[4] ?? "",
    nickname: row[22] ?? "",
    organizationEmail: row[5] ?? "",
    personalEmail: row[6] ?? "",
    creatorTypes: parseCreatorTypes(row[23]),
    newscasterProgram: row[24] ?? "",
    facebook: row[7] ?? "",
    instagram: row[8] ?? "",
    tiktok: row[9] ?? "",
    x: row[10] ?? "",
    profile: row[11] ?? "",
    pictureUrl: row[12] ?? "",
    status: ((row[13] as ProfileStatus) || "Upload") as ProfileStatus,
    listStatus: parseListStatus(row[25]),
    submittedAt: row[14] ?? "",
    completedAt: row[15] ?? "",
    supervisorEmail: row[16] ?? "",
    isNonStaff: (row[17] ?? "").toLowerCase() === "true",
    team: row[18] ?? "",
    lastUpdatedAt: row[19] ?? row[14] ?? "",
    statusLog: row[20] ?? "",
    supervisorApprovedAt: row[21] ?? "",
  };
}

function recordToRow(record: ProfileRecord) {
  return [
    record.queue,
    record.thaiFirstName,
    record.thaiLastName,
    record.englishFirstName,
    record.englishLastName,
    record.organizationEmail,
    record.personalEmail,
    record.facebook,
    record.instagram,
    record.tiktok,
    record.x,
    record.profile,
    record.pictureUrl,
    record.status,
    record.submittedAt,
    record.completedAt,
    record.supervisorEmail,
    record.isNonStaff ? "TRUE" : "FALSE",
    record.team,
    record.lastUpdatedAt,
    record.statusLog,
    record.supervisorApprovedAt,
    record.nickname,
    record.creatorTypes.join(","),
    record.newscasterProgram,
    record.listStatus,
    record.userAccess,
  ];
}

function hasGithubUploadConfig() {
  return Boolean(
    process.env.GITHUB_UPLOAD_TOKEN &&
      process.env.GITHUB_UPLOAD_OWNER &&
      process.env.GITHUB_UPLOAD_REPO,
  );
}

function hasGithubDataConfig() {
  return hasGithubUploadConfig();
}

function getGithubDataPath() {
  return (process.env.GITHUB_DATA_PATH || "data/profiles.json").replace(/^\/+|\/+$/g, "");
}

function normalizeGithubRecord(record: Partial<ProfileRecord>): ProfileRecord {
  return {
    queue: record.queue ?? "",
    userAccess: normalizeUserAccess(record.userAccess),
    thaiFirstName: record.thaiFirstName ?? "",
    thaiLastName: record.thaiLastName ?? "",
    englishFirstName: record.englishFirstName ?? "",
    englishLastName: record.englishLastName ?? "",
    nickname: record.nickname ?? "",
    organizationEmail: record.organizationEmail ?? "",
    personalEmail: record.personalEmail ?? "",
    creatorTypes: normalizeCreatorTypes(record.creatorTypes),
    newscasterProgram: record.newscasterProgram ?? "",
    facebook: record.facebook ?? "",
    instagram: record.instagram ?? "",
    tiktok: record.tiktok ?? "",
    x: record.x ?? "",
    profile: record.profile ?? "",
    team: record.team ?? "",
    pictureUrl: record.pictureUrl ?? "",
    status: record.status ?? "Upload",
    listStatus: normalizeListStatus(record.listStatus),
    submittedAt: record.submittedAt ?? "",
    completedAt: record.completedAt ?? "",
    lastUpdatedAt: record.lastUpdatedAt ?? record.submittedAt ?? "",
    statusLog: record.statusLog ?? (record.submittedAt ? `${record.submittedAt}: Upload` : ""),
    supervisorApprovedAt: record.supervisorApprovedAt ?? "",
    supervisorEmail: record.supervisorEmail ?? "",
    isNonStaff: Boolean(record.isNonStaff),
  };
}

function parseCreatorTypes(value: string | undefined) {
  return normalizeCreatorTypes(
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function normalizeCreatorTypes(value: unknown): CreatorType[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is CreatorType =>
    item === "creator" || item === "columnist" || item === "newscaster",
  );
}

function parseListStatus(value: string | undefined): ListStatus {
  return normalizeListStatus(value);
}

function normalizeListStatus(value: unknown): ListStatus {
  return value === "Disable" ? "Disable" : "Active";
}

function parseUserAccess(value: string | undefined): UserAccess | "" {
  return normalizeUserAccess(value);
}

function normalizeUserAccess(value: unknown): UserAccess | "" {
  return value === "ขอเพิ่ม" || value === "มีแล้ว" ? value : "";
}

function githubHeaders(includeJson = false) {
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${process.env.GITHUB_UPLOAD_TOKEN}`,
    ...(includeJson ? { "content-type": "application/json" } : {}),
    "x-github-api-version": "2022-11-28",
  };
}

async function readGithubProfilesFile() {
  const owner = process.env.GITHUB_UPLOAD_OWNER!;
  const repo = process.env.GITHUB_UPLOAD_REPO!;
  const branch = process.env.GITHUB_UPLOAD_BRANCH || "main";
  const path = getGithubDataPath();

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponentPath(path)}?ref=${encodeURIComponent(branch)}`,
    { headers: githubHeaders() },
  );

  if (response.status === 404) {
    return { records: [] as ProfileRecord[], sha: "" };
  }

  const data = (await response.json()) as {
    content?: string;
    encoding?: string;
    sha?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message || "Unable to read GitHub profile data.");
  }

  if (!data.content || data.encoding !== "base64") {
    return { records: [] as ProfileRecord[], sha: data.sha ?? "" };
  }

  const json = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
  const parsed = JSON.parse(json) as GithubProfilesFile | Partial<ProfileRecord>[];
  const rawRecords = Array.isArray(parsed) ? parsed : parsed.records ?? [];
  const records = rawRecords.map(normalizeGithubRecord).filter((record) => record.queue);

  return { records, sha: data.sha ?? "" };
}

async function writeGithubProfilesFile(records: ProfileRecord[], sha: string, message: string) {
  const owner = process.env.GITHUB_UPLOAD_OWNER!;
  const repo = process.env.GITHUB_UPLOAD_REPO!;
  const branch = process.env.GITHUB_UPLOAD_BRANCH || "main";
  const path = getGithubDataPath();
  const content = Buffer.from(
    JSON.stringify(
      {
        updatedAt: nowIso(),
        records,
      },
      null,
      2,
    ),
  ).toString("base64");

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponentPath(path)}`,
    {
      method: "PUT",
      headers: githubHeaders(true),
      body: JSON.stringify({
        branch,
        content,
        message,
        ...(sha ? { sha } : {}),
      }),
    },
  );

  const data = (await response.json()) as { message?: string };
  if (!response.ok) {
    throw new Error(data.message || "Unable to write GitHub profile data.");
  }
}

async function mutateGithubProfiles<T>(
  message: string,
  updater: (records: ProfileRecord[]) => { records: ProfileRecord[]; value: T },
) {
  const { records, sha } = await readGithubProfilesFile();
  const result = updater([...records]);
  await writeGithubProfilesFile(result.records, sha, message);
  return result.value;
}

async function updateGithubProfile(
  queue: string,
  message: string,
  updater: (record: ProfileRecord) => ProfileRecord,
) {
  const targetQueue = queue.trim();
  return mutateGithubProfiles(message, (records) => {
    const index = records.findIndex((record) => record.queue === targetQueue);
    if (index === -1) return { records, value: null };

    const nextRecord = updater(records[index]);
    const nextRecords = [...records];
    nextRecords[index] = nextRecord;
    return { records: nextRecords, value: nextRecord };
  });
}

export async function getAllProfiles(): Promise<ProfileWithRow[]> {
  if (hasGithubDataConfig()) {
    const { records } = await readGithubProfilesFile();
    return records.map((record, index) => ({
      record,
      rowNumber: index + 2,
    }));
  }

  const response = await getSheetsClient().spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A2:AA`,
  });
  const rows = (response.data.values ?? []) as string[][];
  return rows.filter((row) => row[0]).map((row, index) => ({
    record: rowToRecord(row),
    rowNumber: index + 2,
  }));
}

export async function findProfileByQueue(queue: string) {
  const profiles = await getAllProfiles();
  return profiles.find(({ record }) => record.queue === queue.trim()) ?? null;
}

export async function deleteProfilesByQueues(queues: string[]) {
  const targets = new Set(queues.map((queue) => queue.trim()).filter(Boolean));
  if (targets.size === 0) return [];

  if (hasGithubDataConfig()) {
    return mutateGithubProfiles("Delete selected profile records", (records) => {
      const deleted = records.filter((record) => targets.has(record.queue)).map((record) => record.queue);
      return {
        records: records.filter((record) => !targets.has(record.queue)),
        value: deleted,
      };
    });
  }

  const profiles = await getAllProfiles();
  const rowsToDelete = profiles
    .filter(({ record }) => targets.has(record.queue))
    .sort((a, b) => b.rowNumber - a.rowNumber);

  if (rowsToDelete.length === 0) return [];

  const sheetId = await getSheetNumericId();
  await getSheetsClient().spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: rowsToDelete.map(({ rowNumber }) => ({
        deleteDimension: {
          range: {
            sheetId,
            dimension: "ROWS",
            startIndex: rowNumber - 1,
            endIndex: rowNumber,
          },
        },
      })),
    },
  });

  return rowsToDelete.map(({ record }) => record.queue);
}

export async function createQueueNumber() {
  const { day, month, year } = getBangkokDateParts();
  const suffix = `${day}-${month}-${year}`;
  const profiles = await getAllProfiles();
  const todayNumbers = profiles
    .map(({ record }) => record.queue)
    .filter((queue) => queue.endsWith(suffix))
    .map((queue) => Number.parseInt(queue.split("-")[0] ?? "0", 10))
    .filter(Number.isFinite);

  const nextNumber = todayNumbers.length > 0 ? Math.max(...todayNumbers) + 1 : 1;
  return `${String(nextNumber).padStart(2, "0")}-${suffix}`;
}

export async function appendProfile(record: ProfileRecord) {
  if (hasGithubDataConfig()) {
    await mutateGithubProfiles(`Save profile ${record.queue}`, (records) => {
      const existingIndex = records.findIndex((item) => item.queue === record.queue);
      if (existingIndex >= 0) {
        const nextRecords = [...records];
        nextRecords[existingIndex] = record;
        return { records: nextRecords, value: null };
      }
      return { records: [...records, record], value: null };
    });
    return;
  }

  await getSheetsClient().spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:AA`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [recordToRow(record)],
    },
  });
}

export async function updateProfilePictureUrl(queue: string, pictureUrl: string) {
  const found = await findProfileByQueue(queue);
  if (!found) return null;

  const updatedAt = nowIso();
  const statusLog = `${found.record.statusLog || `${found.record.submittedAt}: Upload`}\n${updatedAt}: Profile image uploaded`;

  if (hasGithubDataConfig()) {
    return updateGithubProfile(queue, `Update profile image ${queue}`, (record) => ({
      ...record,
      pictureUrl,
      lastUpdatedAt: updatedAt,
      statusLog,
    }));
  }

  await getSheetsClient().spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        {
          range: `${SHEET_NAME}!M${found.rowNumber}`,
          values: [[pictureUrl]],
        },
        {
          range: `${SHEET_NAME}!T${found.rowNumber}`,
          values: [[updatedAt]],
        },
        {
          range: `${SHEET_NAME}!U${found.rowNumber}`,
          values: [[statusLog]],
        },
      ],
    },
  });

  return {
    ...found.record,
    pictureUrl,
    lastUpdatedAt: updatedAt,
    statusLog,
  };
}

export async function updateProfileStatus(queue: string, status: ProfileStatus, note = "") {
  const found = await findProfileByQueue(queue);
  if (!found) return null;

  const updatedAt = nowIso();
  const completedAt = status === "Completed" ? updatedAt : found.record.completedAt;
  const noteText = note.trim() ? ` (${note.trim()})` : "";
  const currentLog = found.record.statusLog || `${found.record.submittedAt}: Upload`;
  const statusLog = `${currentLog}\n${updatedAt}: ${status}${noteText}`;

  if (hasGithubDataConfig()) {
    return updateGithubProfile(queue, `Move profile ${queue} to ${status}`, (record) => ({
      ...record,
      status,
      completedAt,
      lastUpdatedAt: updatedAt,
      statusLog,
    }));
  }

  await getSheetsClient().spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        {
          range: `${SHEET_NAME}!N${found.rowNumber}`,
          values: [[status]],
        },
        {
          range: `${SHEET_NAME}!P${found.rowNumber}`,
          values: [[completedAt]],
        },
        {
          range: `${SHEET_NAME}!T${found.rowNumber}`,
          values: [[updatedAt]],
        },
        {
          range: `${SHEET_NAME}!U${found.rowNumber}`,
          values: [[statusLog]],
        },
      ],
    },
  });

  return {
    ...found.record,
    status,
    completedAt,
    lastUpdatedAt: updatedAt,
    statusLog,
  };
}

export async function updateProfileListStatus(queue: string, listStatus: ListStatus) {
  const found = await findProfileByQueue(queue);
  if (!found) return null;

  const updatedAt = nowIso();
  const currentLog = found.record.statusLog || `${found.record.submittedAt}: Upload`;
  const statusLog = `${currentLog}\n${updatedAt}: List status ${listStatus}`;

  if (hasGithubDataConfig()) {
    return updateGithubProfile(queue, `Update list status ${queue}`, (record) => ({
      ...record,
      listStatus,
      lastUpdatedAt: updatedAt,
      statusLog,
    }));
  }

  await getSheetsClient().spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        {
          range: `${SHEET_NAME}!T${found.rowNumber}`,
          values: [[updatedAt]],
        },
        {
          range: `${SHEET_NAME}!U${found.rowNumber}`,
          values: [[statusLog]],
        },
        {
          range: `${SHEET_NAME}!Z${found.rowNumber}`,
          values: [[listStatus]],
        },
      ],
    },
  });

  return {
    ...found.record,
    listStatus,
    lastUpdatedAt: updatedAt,
    statusLog,
  };
}

export async function updateProfileDetails(
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
  const found = await findProfileByQueue(queue);
  if (!found) return null;
  if (found.record.status !== "Upload" && found.record.status !== "Verify") {
    throw new Error("This profile can no longer be edited after admin starts processing.");
  }

  const updatedAt = nowIso();
  const statusLog = `${found.record.statusLog || `${found.record.submittedAt}: Upload`}\n${updatedAt}: User edited profile`;
  const nextRecord: ProfileRecord = {
    ...found.record,
    ...input,
    pictureUrl: pictureUrl || found.record.pictureUrl,
    lastUpdatedAt: updatedAt,
    statusLog,
  };

  if (hasGithubDataConfig()) {
    return updateGithubProfile(queue, `Update profile details ${queue}`, () => nextRecord);
  }

  await getSheetsClient().spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A${found.rowNumber}:AA${found.rowNumber}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [recordToRow(nextRecord)],
    },
  });

  return nextRecord;
}

async function setSupervisorDecision(queue: string, decision: "approved" | "denied") {
  const found = await findProfileByQueue(queue);
  if (!found) return null;
  if (!found.record.supervisorEmail) {
    throw new Error("This profile has no supervisor email.");
  }

  const decidedAt = nowIso();
  const decisionLabel = decision === "approved" ? "Supervisor approved" : "Supervisor denied";
  const sheetValue = decision === "approved" ? `APPROVED:${decidedAt}` : `DENIED:${decidedAt}`;
  const statusLog = `${found.record.statusLog || `${found.record.submittedAt}: Upload`}\n${decidedAt}: ${decisionLabel}`;

  if (hasGithubDataConfig()) {
    return updateGithubProfile(queue, `${decisionLabel} ${queue}`, (record) => ({
      ...record,
      statusLog,
      supervisorApprovedAt: sheetValue,
    }));
  }

  await getSheetsClient().spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        {
          range: `${SHEET_NAME}!U${found.rowNumber}`,
          values: [[statusLog]],
        },
        {
          range: `${SHEET_NAME}!V${found.rowNumber}`,
          values: [[sheetValue]],
        },
      ],
    },
  });

  return {
    ...found.record,
    statusLog,
    supervisorApprovedAt: sheetValue,
  };
}

export async function approveProfileBySupervisor(queue: string) {
  return setSupervisorDecision(queue, "approved");
}

export async function denyProfileBySupervisor(queue: string) {
  return setSupervisorDecision(queue, "denied");
}

export async function uploadImageToDrive(file: File, queue: string) {
  if (hasGithubUploadConfig()) {
    return uploadImageToGithub(file, queue);
  }

  if (process.env.GOOGLE_APPS_SCRIPT_UPLOAD_URL) {
    return uploadImageWithAppsScript(file, queue);
  }

  const drive = getDriveClient();
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeName = `${queue}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const response = await drive.files.create({
    requestBody: {
      name: safeName,
      parents: [DRIVE_FOLDER_ID],
    },
    media: {
      mimeType: file.type,
      body: Readable.from(buffer),
    },
    fields: "id, webViewLink",
  });

  const fileId = response.data.id;
  if (!fileId) throw new Error("Drive upload did not return a file id.");

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return `https://drive.google.com/uc?id=${fileId}`;
}

async function uploadImageWithAppsScript(file: File, queue: string) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileName = `${queue}.${extension}`;
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const response = await fetch(process.env.GOOGLE_APPS_SCRIPT_UPLOAD_URL!, {
    method: "POST",
    headers: {
      "content-type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      folderId: DRIVE_FOLDER_ID,
      fileName,
      mimeType: file.type,
      base64,
    }),
  });

  const data = (await response.json()) as { ok?: boolean; url?: string; message?: string };
  if (!response.ok || !data.ok || !data.url) {
    throw new Error(data.message || "Upload image failed.");
  }

  return data.url;
}

async function uploadImageToGithub(file: File, queue: string) {
  const owner = process.env.GITHUB_UPLOAD_OWNER!;
  const repo = process.env.GITHUB_UPLOAD_REPO!;
  const branch = process.env.GITHUB_UPLOAD_BRANCH || "main";
  const uploadDir = (process.env.GITHUB_UPLOAD_DIR || "profile-images").replace(/^\/+|\/+$/g, "");
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeName = `${queue}.${extension}`;
  const path = `${uploadDir}/${safeName}`;
  const content = Buffer.from(await file.arrayBuffer()).toString("base64");
  const existingSha = await getGithubFileSha(owner, repo, branch, path);

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponentPath(path)}`,
    {
      method: "PUT",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${process.env.GITHUB_UPLOAD_TOKEN}`,
        "content-type": "application/json",
        "x-github-api-version": "2022-11-28",
      },
      body: JSON.stringify({
        branch,
        content,
        message: `Upload profile image ${queue}`,
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    },
  );

  const data = (await response.json()) as {
    content?: { download_url?: string };
    message?: string;
  };

  if (!response.ok || !data.content?.download_url) {
    throw new Error(data.message || "GitHub image upload failed.");
  }

  return data.content.download_url;
}

async function getGithubFileSha(owner: string, repo: string, branch: string, path: string) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponentPath(path)}?ref=${encodeURIComponent(branch)}`,
    {
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${process.env.GITHUB_UPLOAD_TOKEN}`,
        "x-github-api-version": "2022-11-28",
      },
    },
  );

  if (response.status === 404) return "";
  const data = (await response.json()) as { sha?: string; message?: string };
  if (!response.ok) {
    throw new Error(data.message || "Unable to check existing GitHub image.");
  }
  return data.sha ?? "";
}

function encodeURIComponentPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}
