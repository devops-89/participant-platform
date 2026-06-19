import { create } from "zustand";

interface ModalState {
  content: boolean | any;
  showModal: (content: any) => void;
  hideModal: () => void;
}

export const useModal = create<ModalState>((set) => ({
  content: false,
  showModal: (content) => set({ content }),
  hideModal: () => set({ content: false }),
}));
