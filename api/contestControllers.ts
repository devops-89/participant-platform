import { contestSecuredApi } from "./config";

export const contestControllers = {
  getContest: async (country?: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      let url = "/";
      if (country) {
        url = `/?country=${encodeURIComponent(country)}`;
      }
      const response = await contestSecuredApi.get(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getContestDetails: async (id: string | undefined) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const response = await contestSecuredApi.get(`/${id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
