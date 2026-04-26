# User Profile Queue

Next.js app for collecting organization profile data, uploading profile images to Google Drive, writing rows to Google Sheets, tracking queue status, and managing status from an admin page.

## Pages

- `/add-profile` - user profile form and image upload.
- `/edit-profile/[queue]` - user edit page while status is still `Upload`.
- `/track` - queue status lookup with progress steps.
- `/admin` - simple password-protected admin dashboard.

## Google Sheet Schema

The app appends rows to the existing sheet columns exactly as requested:

| Column | Field |
| --- | --- |
| A | queue |
| B | ชื่อ |
| C | นามสกุล |
| D | name |
| E | surname |
| F | email |
| G | email personal |
| H | facebook |
| I | ig |
| J | tiktok |
| K | X |
| L | profile |
| M | link upload picture |
| N | status |
| O | submitted_at |
| P | completed_at |
| Q | supervisor_email |
| R | is_non_staff |
| S | team |
| T | last_update |
| U | status_log |

## Environment Variables

Copy `.env.example` to `.env.local` for local development, then set:

```env
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=
GOOGLE_SHEET_ID=1lfT2mjo1HahuJmmtjVI7yqWGpVprSGjxo7Hnc9M-6vU
GOOGLE_SHEET_NAME=Sheet1
GOOGLE_DRIVE_FOLDER_ID=1Zfyw75eTEgX8Gnckml8zvOPS96B86swo
GOOGLE_APPS_SCRIPT_UPLOAD_URL=
GITHUB_UPLOAD_TOKEN=
GITHUB_UPLOAD_OWNER=
GITHUB_UPLOAD_REPO=
GITHUB_UPLOAD_BRANCH=main
GITHUB_UPLOAD_DIR=profile-images
ADMIN_PASSWORD=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
USE_MOCK_GOOGLE=false
```

Recommended credential format:

1. Create a Google Cloud service account.
2. Enable Google Sheets API and Google Drive API.
3. Create a JSON key.
4. Share the Google Sheet with the service account email as Editor.
5. Base64 encode the JSON and put it in `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`.

For Windows PowerShell:

```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes((Get-Content .\service-account.json -Raw)))
```

## Google Drive Upload via Apps Script

Google service accounts do not have normal My Drive storage quota. If you upload files directly with the service account, Google Drive can return: `Service Accounts do not have storage quota`.

Use this Apps Script Web App for image uploads. It runs as your Google user and saves files into the target Drive folder.

1. Open [Google Apps Script](https://script.google.com/).
2. Create a new project.
3. Paste this code:

```js
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const folder = DriveApp.getFolderById(data.folderId);
    const bytes = Utilities.base64Decode(data.base64);
    const blob = Utilities.newBlob(bytes, data.mimeType, data.fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        url: "https://drive.google.com/uc?id=" + file.getId()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        message: error && error.message ? error.message : String(error)
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Click `Deploy` -> `New deployment`.
5. Type: `Web app`.
6. Execute as: `Me`.
7. Who has access: `Anyone`.
8. Deploy and authorize.
9. Copy the Web App URL.
10. Put it in Vercel as `GOOGLE_APPS_SCRIPT_UPLOAD_URL`.

Keep `GOOGLE_DRIVE_FOLDER_ID=1Zfyw75eTEgX8Gnckml8zvOPS96B86swo`.

## GitHub Image Upload

If GitHub upload environment variables are set, profile images are uploaded to GitHub before any Google Drive upload method is used. The Sheet stores the raw GitHub image URL in column M, so admins can click `View` in the Picture column and save the image from the browser.

Recommended setup:

```env
GITHUB_UPLOAD_TOKEN=github fine-grained token
GITHUB_UPLOAD_OWNER=your-github-username-or-org
GITHUB_UPLOAD_REPO=your-public-repo
GITHUB_UPLOAD_BRANCH=main
GITHUB_UPLOAD_DIR=profile-images
```

Create a fine-grained GitHub token with access to the target repository and `Contents: Read and write` permission. Keep the repository public if you want the `View` link to open without GitHub authentication.

## Local UI Preview Without Google Credentials

To preview `/admin` and `/track` before connecting Google Sheets/Drive, set:

```env
ADMIN_PASSWORD=12345678
USE_MOCK_GOOGLE=true
```

Restart the dev server after changing `.env.local`. Do not use mock mode in production.

## Email Notifications

When admin moves a profile to `Verify`, the app opens a note modal and sends that note to the user email automatically after submit. Configure SMTP variables in `.env.local` or Vercel Environment Variables:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM="Profile Admin <no-reply@example.com>"
```

In `USE_MOCK_GOOGLE=true` preview mode, missing SMTP settings are skipped so the UI can be tested locally.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Checks

```bash
npm run test
npm run build
```

## Deploy to GitHub and Vercel

1. Push this repository to GitHub.
2. Import the GitHub repository in Vercel.
3. Add all environment variables from `.env.example` in Vercel Project Settings.
4. Deploy.
5. Test `/add-profile` with a small jpg/png/webp image, then confirm the row in Google Sheets and the uploaded file in Google Drive.

## Status Flow

- New submissions start as `Upload`.
- Admin can move a record to `Verify`.
- Admin can move a record to `Completed`; this also writes `completed_at`.

Existing user rows are not edited after submission except for admin status and completed timestamp updates.
