import { create } from "zustand";
import { UserType } from "@/types/user";

interface UserState {
  user: UserType | null;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  error: string | null;
  setUser: (user: UserType | null) => void;
  fetchUser: (clerkId: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  setIsLoading: (value) => {
    set({ isLoading: value });
  },
  error: null,
  setUser: (user) => set({ user, isLoading: false }),
  fetchUser: async (clerkId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/en/api/users/${clerkId}`);
      if (!response.ok) throw new Error("Failed to fetch user");

      const userData = await response.json();
      set({ user: userData, isLoading: false });
    } catch (error) {
      set({ error: (error as { message: string }).message, isLoading: false });
    }
  },
}));
