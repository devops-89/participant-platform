const baseUrl = "https://api.competition.topyounginnovators.org/api/";

const isDev = process.env.NODE_ENV !== "production";

export const SERVER_ENDPOINTS = {
  AUTH_BASEURL: baseUrl + "auth/",
  USER_BASEURL: baseUrl + "users/",
  CONTEST_BASEURL: baseUrl + "contest/",
  ENTRY_BASEURL: baseUrl + "entry/",
  FORM_BASEURL: baseUrl + "form-builder/",
};
