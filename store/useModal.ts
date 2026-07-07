import { ReactNode } from "react";
import { create } from "zustand";

interface ModalState {
  content: ReactNode | null;
  showModal: (content: ReactNode) => void;
  hideModal: () => void;
}

export const useModal = create<ModalState>((set) => ({
  content: null,
  showModal: (content) => set({ content }),
  hideModal: () => set({ content: null }),
}));
