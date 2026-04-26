"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { MAX_IMAGE_BYTES } from "@/lib/config";
import { validateImageFile, validateProfile } from "@/lib/validation";
import {
  CREATOR_TYPES,
  TEAMS,
  USER_ACCESS_OPTIONS,
  type CreatorType,
  type ProfileRecord,
  type SubmitProfileInput,
  type UserAccess,
} from "@/lib/types";

const initialForm: SubmitProfileInput = {
  userAccess: "",
  thaiFirstName: "",
  thaiLastName: "",
  englishFirstName: "",
  englishLastName: "",
  nickname: "",
  organizationEmail: "",
  personalEmail: "",
  creatorTypes: [],
  newscasterProgram: "",
  facebook: "",
  instagram: "",
  tiktok: "",
  x: "",
  profile: "",
  team: "",
  supervisorEmail: "",
  isNonStaff: false,
};

type DialogState = {
  title: string;
  lines: string[];
  queue?: string;
  editHref?: string;
  type: "success" | "error";
};

export default function AddProfilePage() {
  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const imageHelp = useMemo(() => {
    if (!image) return "jpg, jpeg, png, webp up to 10MB";
    return `${image.name} (${(image.size / 1024 / 1024).toFixed(2)}MB)`;
  }, [image]);

  function updateField<K extends keyof SubmitProfileInput>(key: K, value: SubmitProfileInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  function toggleCreatorType(creatorType: CreatorType) {
    setForm((current) => {
      const isSelected = current.creatorTypes.includes(creatorType);
      const creatorTypes = isSelected
        ? current.creatorTypes.filter((item) => item !== creatorType)
        : [...current.creatorTypes, creatorType];
      return {
        ...current,
        creatorTypes,
        newscasterProgram: creatorTypes.includes("newscaster") ? current.newscasterProgram : "",
      };
    });
    setErrors((current) => ({ ...current, creatorTypes: "", newscasterProgram: "" }));
  }

  function selectUserAccess(userAccess: UserAccess) {
    updateField("userAccess", userAccess);
  }

  function showValidationDialog(
    nextErrors: Record<string, string>,
    fallback = "กรุณาตรวจสอบช่องที่มีกรอบสีแดง และกรอกข้อมูลให้ครบ",
  ) {
    const lines = Object.values(nextErrors)
      .map((value) => value.trim())
      .filter(Boolean);

    setDialog({
      title: "กรอกข้อมูลไม่ครบ",
      lines: lines.length > 0 ? lines : [fallback],
      type: "error",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;

    const nextErrors = validateProfile(form);
    const imageError = validateImageFile(image);
    if (imageError) nextErrors.image = imageError;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      showValidationDialog(nextErrors);
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, item));
      } else {
        formData.append(key, String(value));
      }
    });
    if (image) formData.append("image", image);

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/profiles", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        const apiErrors = data.errors ?? {};
        setErrors(apiErrors);
        showValidationDialog(apiErrors, data.message ?? "ส่งข้อมูลไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง");
        return;
      }

      sessionStorage.setItem(`profile:${data.record.queue}`, JSON.stringify(data.record as ProfileRecord));
      const successLines = [
        "Status: Upload",
        data.adminRecord?.saved ? "บันทึกข้อมูลเข้าระบบ admin แล้ว" : "ระบบได้รับข้อมูลแล้ว",
        "กรุณาเก็บเลขอ้างอิงไว้สำหรับตรวจสอบสถานะ",
      ];
      if (data.supervisorEmail) {
        successLines.push(
          data.supervisorEmail.sent
            ? "ส่งอีเมลให้ผู้บังคับบัญชาเรียบร้อยแล้ว"
            : `บันทึกข้อมูลแล้ว แต่ส่งอีเมลให้ผู้บังคับบัญชาไม่สำเร็จ: ${data.supervisorEmail.message ?? "กรุณาตรวจ SMTP settings"}`,
        );
      }
      if (data.imageUpload && !data.imageUpload.uploaded) {
        successLines.push(
          `บันทึกข้อมูลแล้ว แต่อัปโหลดรูปไม่สำเร็จ: ${data.imageUpload.message ?? "กรุณาลองแก้ไขข้อมูลเพื่ออัปโหลดรูปอีกครั้ง"}`,
        );
      }

      setDialog({
        title: "ระบบได้รับข้อมูลเรียบร้อยแล้ว",
        lines: successLines,
        queue: data.record.queue,
        editHref: `/edit-profile/${encodeURIComponent(data.record.queue)}`,
        type: "success",
      });
      setForm(initialForm);
      setImage(null);
      formElement.reset();
    } catch (error) {
      setDialog({
        title: "ส่งข้อมูลไม่สำเร็จ",
        lines: [error instanceof Error ? error.message : "Submit failed."],
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page">
      <div className="heading">
        <h1>Add profile</h1>
        <p>
          กรอกข้อมูลส่วนตัวและอัปโหลดรูปภาพ ระบบจะบันทึกและออกเลข queue
          สำหรับติดตามสถานะ
        </p>
      </div>

      <form className="panel" onSubmit={handleSubmit}>
        <div className="panel-body">
          <div className="top-choice-grid">
            <div className="choice-block">
              <div className="field-label">
                User access <RequiredMark />
              </div>
              <div className="checkbox-group">
                {USER_ACCESS_OPTIONS.map((option) => (
                  <label className="checkbox-inline" key={option}>
                    <input
                      checked={form.userAccess === option}
                      type="checkbox"
                      onChange={() => selectUserAccess(option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
              {errors.userAccess ? <span className="error-text">{errors.userAccess}</span> : null}
            </div>

            <div className="choice-block">
              <div className="field-label">
                Creator Type <RequiredMark />
              </div>
              <div className="checkbox-group">
                {CREATOR_TYPES.map((creatorType) => (
                  <label className="checkbox-inline" key={creatorType}>
                    <input
                      checked={form.creatorTypes.includes(creatorType)}
                      type="checkbox"
                      onChange={() => toggleCreatorType(creatorType)}
                    />
                    {creatorType}
                  </label>
                ))}
              </div>
              {errors.creatorTypes ? <span className="error-text">{errors.creatorTypes}</span> : null}
            </div>
          </div>

          {form.creatorTypes.includes("newscaster") ? (
            <div className="grid" style={{ marginTop: "1rem" }}>
              <Field
                label="ชื่อรายการ"
                required
                error={errors.newscasterProgram}
                value={form.newscasterProgram}
                onChange={(value) => updateField("newscasterProgram", value)}
              />
            </div>
          ) : null}

          <div className="divider" />

          <div className="grid">
            <Field
              label="ชื่อภาษาไทย"
              required
              error={errors.thaiFirstName}
              value={form.thaiFirstName}
              onChange={(value) => updateField("thaiFirstName", value)}
            />
            <Field
              label="นามสกุลภาษาไทย"
              required
              error={errors.thaiLastName}
              value={form.thaiLastName}
              onChange={(value) => updateField("thaiLastName", value)}
            />
            <Field
              label="ชื่อภาษาอังกฤษ"
              required
              error={errors.englishFirstName}
              value={form.englishFirstName}
              onChange={(value) => updateField("englishFirstName", value)}
            />
            <Field
              label="นามสกุลภาษาอังกฤษ"
              required
              error={errors.englishLastName}
              value={form.englishLastName}
              onChange={(value) => updateField("englishLastName", value)}
            />
            <Field
              label="ชื่อเล่น / นามปากกา"
              placeholder="ไม่จำเป็นต้องกรอก"
              error={errors.nickname}
              value={form.nickname}
              onChange={(value) => updateField("nickname", value)}
            />
            <Field
              label="email องค์กร"
              required={!form.personalEmail}
              type="email"
              error={errors.organizationEmail}
              value={form.organizationEmail}
              onChange={(value) => updateField("organizationEmail", value)}
            />
            <Field
              label="email ส่วนตัว"
              placeholder="ถ้ามี email องค์กรแล้วไม่จำเป็นต้องกรอก"
              required={form.isNonStaff || !form.organizationEmail}
              type="email"
              error={errors.personalEmail}
              value={form.personalEmail}
              onChange={(value) => updateField("personalEmail", value)}
            />
            <label className="field">
              <span>
                Team <RequiredMark />
              </span>
              <select
                value={form.team}
                onChange={(event) => updateField("team", event.target.value)}
              >
                <option value="">เลือก team</option>
                {TEAMS.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
              {errors.team ? <span className="error-text">{errors.team}</span> : null}
            </label>
          </div>

          <label className="checkbox-row">
            <input
              checked={form.isNonStaff}
              type="checkbox"
              onChange={(event) => updateField("isNonStaff", event.target.checked)}
            />
            ไม่ได้เป็นพนักงานประจำ
            <span className="checkbox-note">
              (ใส่ email เพื่อส่งขออนุมัติจากผู้บังคับบัญชา)
            </span>
          </label>

          {form.isNonStaff || (!form.organizationEmail && form.personalEmail) ? (
            <div className="grid" style={{ marginTop: "1rem" }}>
              <Field
                label="email ผู้บังคับบัญชา"
                required
                type="email"
                error={errors.supervisorEmail}
                value={form.supervisorEmail}
                onChange={(value) => updateField("supervisorEmail", value)}
              />
            </div>
          ) : null}

          <div className="divider" />

          <div className="section-title">Social media</div>
          <div className="grid" style={{ marginTop: "0.75rem" }}>
            <Field label="Facebook" value={form.facebook} onChange={(value) => updateField("facebook", value)} />
            <Field label="Instagram" value={form.instagram} onChange={(value) => updateField("instagram", value)} />
            <Field label="TikTok" value={form.tiktok} onChange={(value) => updateField("tiktok", value)} />
            <Field label="X/Twitter" value={form.x} onChange={(value) => updateField("x", value)} />
          </div>

          <div className="divider" />

          <label className="field">
            <span>Profile / bio</span>
            <textarea value={form.profile} onChange={(event) => updateField("profile", event.target.value)} />
          </label>

          <div className="divider" />

          <label className="field">
            <span>
              Upload image <RequiredMark />
            </span>
            <input
              className="file-input"
              accept="image/jpeg,image/png,image/webp"
              type="file"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                if (selected && selected.size > MAX_IMAGE_BYTES) {
                  event.target.value = "";
                  setImage(null);
                  setErrors((current) => ({ ...current, image: "รูปมีขนาดใหญ่เกิน 10MB" }));
                  setDialog({
                    title: "อัปโหลดรูปไม่สำเร็จ",
                    lines: ["รูปมีขนาดใหญ่เกิน 10MB"],
                    type: "error",
                  });
                  return;
                }
                setImage(selected);
                setErrors((current) => ({ ...current, image: "" }));
              }}
            />
            <span className={errors.image ? "error-text" : "muted"}>
              {errors.image || `${imageHelp} · รูปต้องมีขนาดไม่เกิน 10MB`}
            </span>
          </label>

          <div className="divider" />

          <div className="actions">
            <button className="button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={18} aria-hidden="true" /> : <Upload size={18} aria-hidden="true" />}
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
            <span className="muted">After submit, existing rows are never edited.</span>
          </div>
        </div>
      </form>

      {dialog ? <ResultDialog dialog={dialog} onClose={() => setDialog(null)} /> : null}
    </main>
  );
}

function RequiredMark() {
  return <span className="required-mark">*</span>;
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  required = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>
        {label} {required ? <RequiredMark /> : null}
      </span>
      <input
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <span className="error-text">{error}</span> : null}
    </label>
  );
}

function ResultDialog({ dialog, onClose }: { dialog: DialogState; onClose: () => void }) {
  const lines = dialog.lines.map((line) => line.trim()).filter(Boolean);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <strong>{dialog.title}</strong>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className={dialog.type === "success" ? "alert alert-success" : "alert alert-error"}>
          {dialog.type === "success" ? <CheckCircle2 size={18} aria-hidden="true" /> : null}
          {(lines.length > 0 ? lines : ["กรุณาตรวจสอบข้อมูลอีกครั้ง"]).map((line) => (
            <div key={line}>{line}</div>
          ))}
          {dialog.queue ? <strong>Queue number: {dialog.queue}</strong> : null}
        </div>
        <div className="actions" style={{ marginTop: "1rem" }}>
          {dialog.editHref ? (
            <a className="button-secondary" href={dialog.editHref}>
              แก้ไขข้อมูล
            </a>
          ) : null}
          <button className="button" type="button" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
