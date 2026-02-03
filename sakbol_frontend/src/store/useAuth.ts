import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ProfileRoles } from "../shared/enums/ProfileRoles";

type StoreState = {
  selectedRole: ProfileRoles;
  setSelectedRole: (role: ProfileRoles) => void;

  tokenAccess: string;
  tokenRefresh: string;
  setTokenPair: (access: string, refresh: string) => void;

  userId: number | null;
  userRole: string;
  setUserId: (id: number) => void;
  setUserRole: (role: string) => void;

  isLoggedIn: boolean;
  logout: () => void;
};

const useAuth = create<StoreState>()(
  persist(
    (set) => ({
      selectedRole: ProfileRoles.USER,
      setSelectedRole: (role) => set({ selectedRole: role }),

      tokenAccess: "",
      tokenRefresh: "",
      setTokenPair: (access, refresh) =>
        set({
          tokenAccess: access,
          tokenRefresh: refresh,
          isLoggedIn: true,
        }),

      userId: null,
      setUserId: (id) => set({ userId: id }),

      userRole: "",
      setUserRole: (role) => set({ userRole: role }),

      isLoggedIn: false,

      logout: () =>
        set({
          tokenAccess: "",
          tokenRefresh: "",
          userId: null,
          userRole: "",
          isLoggedIn: false,
          selectedRole: ProfileRoles.USER,
        }),
    }),
    {
      name: "auth-storage",

      partialize: (state) => ({
        tokenAccess: state.tokenAccess,
        tokenRefresh: state.tokenRefresh,
        userId: state.userId,
        userRole: state.userRole,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);

export default useAuth;