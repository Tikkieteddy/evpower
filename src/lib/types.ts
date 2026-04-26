export const STATUSES = ["Upload", "Verify", "In progress", "Completed"] as const;

export type ProfileStatus = (typeof STATUSES)[number];

export const LIST_STATUSES = ["Active", "Disable"] as const;

export type ListStatus = (typeof LIST_STATUSES)[number];

export const TEAMS = [
  "Outsource",
  "Channel",
  "รายการเศรษฐกิจ",
  "Wealth",
  "Health",
  "Earth",
  "Online Originals",
  "World",
  "Tech",
  "Online Web",
] as const;

export type Team = (typeof TEAMS)[number];

export const CREATOR_TYPES = ["creator", "columnist", "newscaster"] as const;

export type CreatorType = (typeof CREATOR_TYPES)[number];

export const USER_ACCESS_OPTIONS = ["ขอเพิ่ม", "มีแล้ว"] as const;

export type UserAccess = (typeof USER_ACCESS_OPTIONS)[number];

export type ProfileRecord = {
  queue: string;
  userAccess: UserAccess | "";
  thaiFirstName: string;
  thaiLastName: string;
  englishFirstName: string;
  englishLastName: string;
  nickname: string;
  organizationEmail: string;
  personalEmail: string;
  creatorTypes: CreatorType[];
  newscasterProgram: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  x: string;
  profile: string;
  team: string;
  pictureUrl: string;
  status: ProfileStatus;
  listStatus: ListStatus;
  submittedAt: string;
  completedAt: string;
  lastUpdatedAt: string;
  statusLog: string;
  supervisorApprovedAt: string;
  supervisorEmail: string;
  isNonStaff: boolean;
};

export type SubmitProfileInput = Omit<
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
>;
