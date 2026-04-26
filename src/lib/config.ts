export const SHEET_ID =
  process.env.GOOGLE_SHEET_ID ?? "1lfT2mjo1HahuJmmtjVI7yqWGpVprSGjxo7Hnc9M-6vU";

export const SHEET_NAME = process.env.GOOGLE_SHEET_NAME ?? "Sheet1";

export const DRIVE_FOLDER_ID =
  process.env.GOOGLE_DRIVE_FOLDER_ID ?? "1Zfyw75eTEgX8Gnckml8zvOPS96B86swo";

export const THAILAND_TIME_ZONE = "Asia/Bangkok";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
