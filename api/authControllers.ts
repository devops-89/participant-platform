import {
  FORGOTPASSWORDPAYLOAD,
  LOGINRESPONSE,
  LOGOUTPAYLOAD,
  REGISTERPAYLOAD,
  RESETPASSWORDPAYLOAD,
  RegisterParticipantPayload,
  ParticipantSignupPayload,
} from "@/types/user";

import {
  authPublicApi,
  authSecuredApi,
  userPublicApi,
  userSecuredApi,
} from "./config";

interface VerifyOtpPayload {
  email?: string;
  otp: string;
}

export const AuthControllers = {
  registerParticipants: async (data: RegisterParticipantPayload | ParticipantSignupPayload | FormData) => {
    try {
      return await userPublicApi.post("create-participant", data);
    } catch (error) {
      throw error;
    }
  },

  login: async (payload: LOGINRESPONSE) => {
    try {
      return await authPublicApi.post("login", payload);
    } catch (error) {
      throw error;
    }
  },

  logout: async (payload?: LOGOUTPAYLOAD) => {
    try {
      return await authSecuredApi.post("logout", payload ?? {});
    } catch (error) {
      throw error;
    }
  },

  getCountries: async () => {
    try {
      const result = await userPublicApi.get("countries");
      return result.data;
    } catch (error) {
      throw error;
    }
  },

  verifyOtp: async (payload: VerifyOtpPayload) => {
    try {
      return await userPublicApi.post("verify-otp", payload);
    } catch (error) {
      throw error;
    }
  },

  resendOtp: async (payload: FORGOTPASSWORDPAYLOAD) => {
    try {
      return await authPublicApi.post("resend-otp", payload);
    } catch (error) {
      throw error;
    }
  },

  getParticipants: async () => {
    try {
      const result = await userSecuredApi.get("me");
      return result.data;
    } catch (error) {
      throw error;
    }
  },

  forgotPassword: async (payload: FORGOTPASSWORDPAYLOAD) => {
    try {
      return await authPublicApi.post("forgot-password", payload);
    } catch (error) {
      throw error;
    }
  },

  resetPassword: async (payload: RESETPASSWORDPAYLOAD) => {
    try {
      return await authPublicApi.post("reset-password", payload);
    } catch (error) {
      throw error;
    }
  },

  updateUserDetails: async (
    id: string,
    payload: REGISTERPAYLOAD | FormData
  ) => {
    try {
      const result = await userSecuredApi.put(`/${id}`, payload, {
        headers: {
          "Content-Type":
            payload instanceof FormData
              ? "multipart/form-data"
              : "application/json",
        },
      });

      return result.data;
    } catch (error) {
      throw error;
    }
  },
};
