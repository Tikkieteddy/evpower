import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/config";
import {
  CREATOR_TYPES,
  TEAMS,
  USER_ACCESS_OPTIONS,
  type CreatorType,
  type SubmitProfileInput,
  type UserAccess,
} from "@/lib/types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string) {
  return emailPattern.test(value.trim());
}

export function validateProfile(input: SubmitProfileInput) {
  const errors: Record<string, string> = {};

  if (!input.userAccess.trim()) {
    errors.userAccess = "กรุณาเลือก User access";
  } else if (!USER_ACCESS_OPTIONS.includes(input.userAccess as UserAccess)) {
    errors.userAccess = "กรุณาเลือก User access จากรายการที่กำหนด";
  }

  if (!input.thaiFirstName.trim()) errors.thaiFirstName = "กรุณากรอกชื่อภาษาไทย";
  if (!input.thaiLastName.trim()) errors.thaiLastName = "กรุณากรอกนามสกุลภาษาไทย";
  if (!input.englishFirstName.trim()) errors.englishFirstName = "กรุณากรอกชื่อภาษาอังกฤษ";
  if (!input.englishLastName.trim()) errors.englishLastName = "กรุณากรอกนามสกุลภาษาอังกฤษ";
  if (!input.team.trim()) errors.team = "กรุณาเลือก team";
  if (input.creatorTypes.length === 0) {
    errors.creatorTypes = "กรุณาเลือก Creator Type อย่างน้อย 1 รายการ";
  }
  if (
    input.creatorTypes.some(
      (creatorType) => !CREATOR_TYPES.includes(creatorType as CreatorType),
    )
  ) {
    errors.creatorTypes = "กรุณาเลือก Creator Type จากรายการที่กำหนด";
  }
  if (input.creatorTypes.includes("newscaster") && !input.newscasterProgram.trim()) {
    errors.newscasterProgram = "กรุณากรอกชื่อรายการสำหรับ newscaster";
  }

  const organizationEmail = input.organizationEmail.trim();
  const personalEmail = input.personalEmail.trim();

  if (!organizationEmail && !personalEmail) {
    errors.organizationEmail = "กรุณากรอก email องค์กร หรือ email ส่วนตัว";
    errors.personalEmail = "กรุณากรอก email องค์กร หรือ email ส่วนตัว";
  } else if (organizationEmail && !isValidEmail(organizationEmail)) {
    errors.organizationEmail = "รูปแบบ email องค์กรไม่ถูกต้อง";
  }

  if (input.team && !TEAMS.includes(input.team as (typeof TEAMS)[number])) {
    errors.team = "กรุณาเลือก team จากรายการที่กำหนด";
  }

  if (personalEmail && !isValidEmail(personalEmail)) {
    errors.personalEmail = "รูปแบบ email ส่วนตัวไม่ถูกต้อง";
  }

  if (input.isNonStaff || (!organizationEmail && personalEmail)) {
    if (!personalEmail) {
      errors.personalEmail = "กรุณากรอก email ส่วนตัวสำหรับ non staff";
    }
    if (!input.supervisorEmail.trim()) {
      errors.supervisorEmail = "กรุณากรอก email ผู้บังคับบัญชา";
    } else if (!isValidEmail(input.supervisorEmail)) {
      errors.supervisorEmail = "รูปแบบ email ผู้บังคับบัญชาไม่ถูกต้อง";
    }
  }

  return errors;
}

export function validateImageFile(file: File | null) {
  if (!file) return "กรุณาอัปโหลดรูปภาพ";
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "รองรับเฉพาะ jpg, jpeg, png และ webp";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "รูปมีขนาดใหญ่เกิน 10MB";
  }
  return "";
}
