import { formSecuredApi } from "./config";

export const FORM_CONTROLLERS = {
  getTemplateById: async (id: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      let result = await formSecuredApi.get(`templates/${id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        }
      });
      return result;
    } catch (error) {
      throw error;
    }
  },
};
