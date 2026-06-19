import { contestSecuredApi } from "./config";

export const entryControllers = {
  createEntry: async (contestId: string, data: any) => {
    try {
      const response = await contestSecuredApi.post(
        `/${contestId}/entries`,
        data
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAllEntries: async (contestId: string) => {
    try {
      const response = await contestSecuredApi.get(
        `/${contestId}/entries`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getEntryById: async (contestId: string, entryId: string) => {
    try {
      const response = await contestSecuredApi.get(
        `/${contestId}/entries/${entryId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateEntrySubmission: async (contestId: string, entryId: string, data: any) => {
    try {
      const response = await contestSecuredApi.patch(
        `/${contestId}/entries/${entryId}`,
        data
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteEntry: async (contestId: string, entryId: string) => {
    try {
      const response = await contestSecuredApi.delete(
        `/${contestId}/entries/${entryId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
