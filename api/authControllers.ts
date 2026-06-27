import { authPublicApi, userPublicApi, userSecuredApi } from "./config";

export const AuthControllers = {
  registerParticipants: async (data: any) => {
    try {
      let result = await userPublicApi.post("create-participant", data);
      return result;
    } catch (error) {
      throw error;
    }
  },
  login: async (payload: any) => {
    try {
      let result = await authPublicApi.post("login", payload);
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
  verifyOtp: async (payload: { email?: string; otp: string; [key: string]: any }) => {
    try {
      let result = await userPublicApi.post("verify-otp", payload);
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
  resetPassword: async (payload: any) => {
    try {
      let result = await authPublicApi.post("reset-password", payload);
      return result;
    } catch (error) {
      throw error;
    }
  },
  updateUserDetails: async (id: string, payload: any) => {
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

