import { CONTESTDETAILS } from "@/types/user";
import { create } from "zustand";

interface ContestDetailsState {
  contest: CONTESTDETAILS | null;
  setContest: (contest: CONTESTDETAILS) => void;
}

export const useContestDetails = create<ContestDetailsState>((set) => ({
  contest: null,
  setContest: (contest: CONTESTDETAILS) => set({ contest }),
}));
