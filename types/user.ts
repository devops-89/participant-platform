import { UserRole, UserStatus } from "@/utils/enum";
import { TextFieldVariants } from "@mui/material";

export interface FormIdentity {
  name: string;
  timestamp: string;
  title: string;
}

export interface CountryType {
  code: string;
  label: string;
  phone: string;
  suggested?: boolean;
}

export interface FieldConfig {
  [key: string]: unknown;
}

export interface SubmissionData {
  [key: string]: string;
}

export interface DynamicFormData {
  [key: string]: string | number | boolean | null | string[] | File;
}

export interface ContestTemplateField {
  id: string;
  config?: FieldConfig;
  label: string;
  required: boolean;
  type: string;
  variant: TextFieldVariants;
  options?: string[] | readonly CountryType[];
  placeholder?: string;
  helperText?: string;
  defaultCountry?: string;
}

export interface ContestTemplateSchema {
  fields: ContestTemplateField[];
  form_identity: FormIdentity;
}

export interface ContestTemplate {
  id: string;
  createdAt: string;
  isActive: boolean;
  name: string;
  schema: ContestTemplateSchema;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  company?: string;
  dateOfBirth?: string;
  grade?: string;
  schoolName?: string;
  countryOfResidence?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  joinedAt: string;
  lastLogin: string;
  bio?: string;
}

export interface RegisterParticipantPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string | null;
  grade: string;
  password?: string;
  schoolName: string;
  country: string;
  role: string;
  confirmPassword?: string;
}

export interface ParticipantSignupPayload {
  contestId: string;
  countryId: string;
  formData: DynamicFormData;
}

export interface LOGINRESPONSE {
  email: string;
  password: string;
}

export interface TABLE_HEADER_DATA_PROPS {
  label: string;
}

export interface AddContestPayload {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  available_regions: string[];
  user_level_template_id: string;
  entry_level_template_id: string;
}

 export interface ContestParticipant {
  id: string;
  contest_id: string;
  submission_id: string;
  status: string;
  joined_at: string;
  submission: {
    id: string;
    data: SubmissionData;
    createdAt: string;
  };
  entries?: unknown[];
  contest?: {
    id?: string;
    _id?: string;
    status?: string;
  };
}

export interface ContestEntry {
  id: string;
  contest_id: string;
  participant_id: string;
  submission_id: string;
  score: number;
  status: string;
  created_at: string;
  updated_at: string;
  participant?: ContestParticipant;
  submission?: {
    id: string;
    data: SubmissionData;
    createdAt: string;
  };
}

export interface CONTESTDETAILS {
  available_regions: string;
  description: string;
  end_date: string;
  entry_level_template: ContestTemplate;
  entry_level_template_id: string;
  id: string;
  name: string;
  needs_moderation: number;
  start_date: string;
  status: UserStatus;
  total_entries: number;
  total_votes: number;
  userLevelTemplate: ContestTemplate;
  user_level_template_id: string;
  participants: ContestParticipant[];
  entries?: ContestEntry[];
}

export interface JUDGEPAYLOAD {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  expertise: string[];
}

export interface USER_DATA {
  avatarUrl: string | null;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  id: string;
  participantProfile: {
    country: string;
    createdAt: string;
    dateOfBirth: string;
    grade: string;
    id: string;
    schoolName: string;
  };
  phone: string;
  role: string;
  status: string;
}

export interface REGISTERPAYLOAD {
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface LOGOUTPAYLOAD {
  refreshToken: string;
}

export interface FORGOTPASSWORDPAYLOAD {
  email: string;
}

export interface RESETPASSWORDPAYLOAD {
  email: string;
  otp: string;
  password: string;
}

export interface ASSIGNJUDGEPAYLOAD {
  judge_id: string;
  entry_ids: string[];
}

export interface VotingPeriodCriterion {
  description: string;
  weighting: number;
}

export interface VotingPeriodPayload {
  voting_type?: string;
  start_date: string;
  end_date: string;
  max_score?: number;
  criteria?: VotingPeriodCriterion[];
  judge_ids?: string[];
}

export interface EntrySubmissionPayload {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | File
    | File[]
    | string[]
    | number[];
}

export interface EntryField {
  id: string;
  label: string;
  value?: string | number | boolean | null;
  type: string;
}

export interface EntryGroup {
  title?: string;
  fields: EntryField[];
}

export interface ColorPalette {
  PRIMARY: string;
  TEXT_PRIMARY: string;
  TEXT_SECONDARY: string;
  BORDER: string;
  SURFACE: string;
}

export interface TemplateField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface FormValues {
  [key: string]: string | Blob;
}


export interface UserData {
  status?: string;
  contestId?: string;
  contests?: {
    id: string;
    entryLevelTemplate?: {
      schema?: {
        fields: TemplateField[];
      };
    };
  }[];
  participants?: ContestParticipant[];
}

export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}