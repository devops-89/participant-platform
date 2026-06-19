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
};
