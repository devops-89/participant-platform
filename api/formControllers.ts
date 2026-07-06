import { formSecuredApi } from "./config";

export const FORM_CONTROLLERS = {
  getTemplateById: async (id: string) => {
    try {
      const result = await formSecuredApi.get(`templates/${id}`);
      return result;
    } catch (error) {
      throw error;
    }
  },
};