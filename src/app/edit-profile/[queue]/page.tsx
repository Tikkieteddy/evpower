"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { MAX_IMAGE_BYTES } from "@/lib/config";
import { validateProfile } from "@/lib/validation";
import {
  CREATOR_TYPES,
  TEAMS,
  USER_ACCESS_OPTIONS,
  type CreatorType,
  type ProfileRecord,
  type SubmitProfileInput,
  type UserAccess,
} from "@/lib/types";

const emptyForm: SubmitProfileInput = {
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

export default function EditProfilePage() {
  const params = useParams<{ queue: string }>();
  const router = useRouter();
  const queue = decodeURIComponent(params.queue);
  const [form, setForm] = useState<SubmitProfileInput>(emptyForm);
  const [record, setRecord] = useState<ProfileRecord | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dialog, setDialog] = useState<{ title: string; lines: string[]; redirectTo?: string; variant?: "error" | "success" } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = record?.status === "Upload" || record?.status === "Verify";

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/profiles/${encodeURIComponent(queue)}`);
        const data = await response.json();
        let loadedRecord = data.record as ProfileRecord | undefined;

        if (!response.ok) {
          const cached = sessionStorage.getItem(`profile:${queue}`);
          if (cached) loadedRecord = JSON.parse(cached) as ProfileRecord;
          if (!loadedRecord) throw new Error(data.message ?? "Queue not found.");
        }

        if (!mounted || !loadedRecord) return;
        setRecord(loadedRecord);
        setForm(recordToForm(loadedRecord));
      } catch (error) {
        setDialog({
          title: "โหลดข้อมูลไม่สำเร็จ",
          lines: [error instanceof Error ? error.message : "Queue not found."],
        });
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [queue]);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateProfile(form);
    if (image && image.size > MAX_IMAGE_BYTES) nextErrors.image = "รูปมีขนาดใหญ่เกิน 10MB";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setDialog({ title: "กรอกข้อมูลไม่ครบ", lines: Object.values(nextErrors) });
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

    setIsSaving(true);
    try {
      const response = await fetch(`/api/profiles/${encodeURIComponent(queue)}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors(data.errors ?? {});
        throw new Error(data.message ?? "Unable to update profile.");
      }
      setRecord(data.record);
      setForm(recordToForm(data.record));
      sessionStorage.setItem(`profile:${queue}`, JSON.stringify(data.record));
      setDialog({
        title: "บันทึกข้อมูลเรียบร้อยแล้ว",
        lines: [`Queue: ${queue}`, `Status: ${data.record.status}`],
        redirectTo: `/track?queue=${encodeURIComponent(queue)}`,
        variant: "success",
      });
    } catch (error) {
      setDialog({
        title: "บันทึกข้อมูลไม่สำเร็จ",
        lines: [error instanceof Error ? error.message : "Unable to update profile."],
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="page">
      <div className="heading">
        <h1>Edit profile</h1>
        <p>Queue: {queue}</p>
      </div>

      {isLoading ? (
        <div className="panel"><div className="panel-body">Loading...</div></div>
      ) : record && !canEdit ? (
        <div className="panel">
          <div className="panel-body">
            <div className="alert alert-error">
              ไม่สามารถแก้ไขข้อมูลได้แล้ว เพราะสถานะปัจจุบันคือ {record.status}
            </div>
          </div>
        </div>
      ) : (
        <form className="panel" onSubmit={handleSubmit}>
          <div className="panel-body">
            <div className="top-choice-grid">
              <div className="choice-block">
                <div className="field-label">User access <RequiredMark /></div>
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
                <div className="field-label">Creator Type <RequiredMark /></div>
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
                <Field label="ชื่อรายการ" required value={form.newscasterProgram} error={errors.newscasterProgram} onChange={(value) => updateField("newscasterProgram", value)} />
              </div>
            ) : null}

            <div className="divider" />

            <div className="grid">
              <Field label="ชื่อภาษาไทย" required value={form.thaiFirstName} error={errors.thaiFirstName} onChange={(value) => updateField("thaiFirstName", value)} />
              <Field label="นามสกุลภาษาไทย" required value={form.thaiLastName} error={errors.thaiLastName} onChange={(value) => updateField("thaiLastName", value)} />
              <Field label="ชื่อภาษาอังกฤษ" required value={form.englishFirstName} error={errors.englishFirstName} onChange={(value) => updateField("englishFirstName", value)} />
              <Field label="นามสกุลภาษาอังกฤษ" required value={form.englishLastName} error={errors.englishLastName} onChange={(value) => updateField("englishLastName", value)} />
              <Field label="ชื่อเล่น / นามปากกา" placeholder="ไม่จำเป็นต้องกรอก" value={form.nickname} error={errors.nickname} onChange={(value) => updateField("nickname", value)} />
              <Field label="email องค์กร" required={!form.personalEmail} type="email" value={form.organizationEmail} error={errors.organizationEmail} onChange={(value) => updateField("organizationEmail", value)} />
              <Field label="email ส่วนตัว" placeholder="ถ้ามี email องค์กรแล้วไม่จำเป็นต้องกรอก" required={form.isNonStaff || !form.organizationEmail} type="email" value={form.personalEmail} error={errors.personalEmail} onChange={(value) => updateField("personalEmail", value)} />
              <label className="field">
                <span>Team <RequiredMark /></span>
                <select value={form.team} onChange={(event) => updateField("team", event.target.value)}>
                  <option value="">เลือก team</option>
                  {TEAMS.map((team) => <option key={team} value={team}>{team}</option>)}
                </select>
                {errors.team ? <span className="error-text">{errors.team}</span> : null}
              </label>
            </div>

            <label className="checkbox-row">
              <input checked={form.isNonStaff} type="checkbox" onChange={(event) => updateField("isNonStaff", event.target.checked)} />
              ไม่ได้เป็นพนักงานประจำ
              <span className="checkbox-note">(ใส่ email เพื่อส่งขออนุมัติจากผู้บังคับบัญชา)</span>
            </label>

            {form.isNonStaff || (!form.organizationEmail && form.personalEmail) ? (
              <div className="grid" style={{ marginTop: "1rem" }}>
                <Field label="email ผู้บังคับบัญชา" required type="email" value={form.supervisorEmail} error={errors.supervisorEmail} onChange={(value) => updateField("supervisorEmail", value)} />
              </div>
            ) : null}

            <div className="divider" />
            <div className="grid">
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
              <span>Upload image</span>
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
                    setDialog({ title: "อัปโหลดรูปไม่สำเร็จ", lines: ["รูปมีขนาดใหญ่เกิน 10MB"] });
                    return;
                  }
                  setImage(selected);
                  setErrors((current) => ({ ...current, image: "" }));
                }}
              />
              <span className={errors.image ? "error-text" : "muted"}>
                {errors.image || "ถ้าไม่เลือกไฟล์ใหม่ ระบบจะใช้รูปเดิม · รูปต้องมีขนาดไม่เกิน 10MB"}
              </span>
            </label>

            <div className="divider" />
            <button className="button" type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 size={18} aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
              Save changes
            </button>
          </div>
        </form>
      )}

      {dialog ? (
        <Dialog
          title={dialog.title}
          lines={dialog.lines}
          variant={dialog.variant ?? "error"}
          onClose={() => {
            const redirectTo = dialog.redirectTo;
            setDialog(null);
            if (redirectTo) router.push(redirectTo);
          }}
        />
      ) : null}
    </main>
  );
}

function recordToForm(record: ProfileRecord): SubmitProfileInput {
  return {
    userAccess: record.userAccess ?? "",
    thaiFirstName: record.thaiFirstName,
    thaiLastName: record.thaiLastName,
    englishFirstName: record.englishFirstName,
    englishLastName: record.englishLastName,
    nickname: record.nickname ?? "",
    organizationEmail: record.organizationEmail,
    personalEmail: record.personalEmail,
    creatorTypes: record.creatorTypes ?? [],
    newscasterProgram: record.newscasterProgram ?? "",
    facebook: record.facebook,
    instagram: record.instagram,
    tiktok: record.tiktok,
    x: record.x,
    profile: record.profile,
    team: record.team,
    supervisorEmail: record.supervisorEmail,
    isNonStaff: record.isNonStaff,
  };
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
      <span>{label} {required ? <RequiredMark /> : null}</span>
      <input placeholder={placeholder} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      {error ? <span className="error-text">{error}</span> : null}
    </label>
  );
}

function Dialog({
  title,
  lines,
  onClose,
  variant,
}: {
  title: string;
  lines: string[];
  onClose: () => void;
  variant: "error" | "success";
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <strong>{title}</strong>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className={`alert ${variant === "success" ? "alert-success" : "alert-error"}`}>
          {lines.map((line) => <div key={line}>{line}</div>)}
        </div>
        <div className="actions" style={{ marginTop: "1rem" }}>
          <button className="button" type="button" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}
