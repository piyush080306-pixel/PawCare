import { create } from 'zustand';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, kind = 'success') => {
    counter += 1;
    const id = counter;
    set(state => ({ toasts: [...state.toasts.slice(-3), { id, kind, message }] }));
    window.setTimeout(() => get().dismiss(id), kind === 'error' ? 6000 : 3800);
  },
  dismiss: id => set(state => ({ toasts: state.toasts.filter(toast => toast.id !== id) })),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().push(message, 'success'),
  error: (message: string) => useToastStore.getState().push(message, 'error'),
  info: (message: string) => useToastStore.getState().push(message, 'info'),
};
