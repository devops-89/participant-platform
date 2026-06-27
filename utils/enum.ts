export const DARK_COLORS = {
  PRIMARY: "#818cf8",
  SECONDARY: "#c084fc",
  BACKGROUND: "#020617",
  SURFACE: "#0f172a",
  TEXT_PRIMARY: "#f1f5f9",
  TEXT_SECONDARY: "#94a3b8",
  ACCENT: "#2de1d6",
  ERROR: "#f43f5e",
  BORDER: "rgba(255, 255, 255, 0.05)",
};

export const LIGHT_COLORS = {
  PRIMARY: "#6366f1",
  SECONDARY: "#8b5cf6",
  BACKGROUND: "#f8fafc",
  SURFACE: "#ffffff",
  TEXT_PRIMARY: "#0f172a",
  TEXT_SECONDARY: "#64748b",
  ACCENT: "#0d9488",
  ERROR: "#ef4444",
  BORDER: "rgba(0, 0, 0, 0.1)",
};

export enum COLORS {
  PRIMARY = "#6366f1",
  SECONDARY = "#8b5cf6",
  BACKGROUND = "#f8fafc",
  SURFACE = "#ffffff",
  TEXT_PRIMARY = "#0f172a",
  TEXT_SECONDARY = "#64748b",
  ACCENT = "#0d9488",
  ERROR = "#ef4444",
  BORDER = "rgba(0, 0, 0, 0.1)",
}

export enum UserRole {
  ADMIN = "admin",
  JUDGE = "judge",
  PARTICIPANT = "participant",
  MODERATOR = "moderator",
  ALL = "All",
}

export enum UserStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
  SUSPENDED = "Suspended",
  PENDING = "Pending",
  BANNED = "Banned",
  REJECTED = "Rejected",
  ALL = "All",
  UPCOMING = "Upcoming",
  COMPLETED = "Completed",
  OFFLINE = "Offline",
  PUBLISHED = "Published",
  DRAFT = "Draft",
}

export enum SEVERITY {
  SUCCESS = "success",
  ERROR = "error",
}

export enum FIELDS_TYPE {
  TEXTFIELD = "textfield",
  TEL_INPUT = "telInput",
  NUMBER_FIELD = "numberField",
  DATE_PICKER = "datePicker",
  COUNTRY_SELECTOR = "countrySelector",
  AUTOCOMPLETE = "autocomplete",
  SELECT = "select",
  RADIO = "radio",
  CHECKBOX = "checkbox",
  SWITCH = "switch",
  SLIDER = "slider",
  RATING = "rating",
  BUTTON = "button",
  PASSWORD = "password",
  STEP_BREAK = "step_break",
  FILE_UPLOAD = "file_upload",
  TEXTAREA = "textarea",
  TEXTBLOCK = "textblock",
}

export enum VOTING_PERIOD_TYPE {
  PUBLIC_VOTING = "PUBLIC",
  JUDGE_VOTING = "JUDGE",
}
