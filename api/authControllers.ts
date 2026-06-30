import { authPublicApi, authSecuredApi, userPublicApi, userSecuredApi } from "./config";

export const AuthControllers = {
  registerParticipants: async (data: Record<string, unknown>) => {
    try {
      let result = await userPublicApi.post("create-participant", data);
      return result;
    } catch (error) {
      throw error;
    }
  },
  login: async (payload: Record<string, unknown>) => {
    try {
      let result = await authPublicApi.post("login", payload);
      return result;
    } catch (error) {
      throw error;
    }
  },
  logout: async (payload: Record<string, unknown> = {}) => {
    try {
      // Assuming authSecuredApi is what we should use. 
      // If it's not exported from config, we will check next.
      let result = await authSecuredApi.post("logout", payload);
      return result;
    } catch (error) {
      throw error;
    }
  },
  getCountries: async () => {
    try {
      let result = await userPublicApi.get("countries");
      return result.data;
    } catch (error) {
      throw error;
    }
  },
  verifyOtp: async (payload: { email?: string; otp: string; [key: string]: unknown }) => {
    try {
      let result = await userPublicApi.post("verify-otp", payload);
      return result;
    } catch (error) {
      throw error;
    }
  },
  resendOtp: async (payload: Record<string, unknown>) => {
    try {
      let result = await authPublicApi.post("resend-otp", payload);
      return result;
    } catch (error) {
      throw error;
    }
  },
  getParticipants: async () => {
    try {
      let result = await userSecuredApi.get("me");
      return result.data;
    } catch (error) {
      throw error;
    }
  },
  forgotPassword: async (payload: { email: string }) => {
    try {
      let result = await authPublicApi.post("forgot-password", payload);
      return result;
    } catch (error) {
      throw error;
    }
  },
  resetPassword: async (payload: Record<string, unknown>) => {
    try {
      let result = await authPublicApi.post("reset-password", payload);
      return result;
    } catch (error) {
      throw error;
    }
  },
  updateUserDetails: async (id: string, payload: Record<string, unknown> | FormData) => {
    try {
      let result = await userSecuredApi.put(`/${id}`, payload, {
        headers: {
          "Content-Type": payload instanceof FormData ? "multipart/form-data" : "application/json",
        }
      });
      return result.data;
    } catch (error) {
      throw error;
    }
  },
};

