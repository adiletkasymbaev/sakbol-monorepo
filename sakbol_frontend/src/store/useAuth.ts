import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ProfileRoles } from "../shared/enums/ProfileRoles";

// Decode user_id directly from JWT payload as a fallback
function userIdFromToken(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const raw = payload?.user_id;
    const parsed = Number(raw);
    return isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

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

  setLoginData: (
    access: string,
    refresh: string,
    userId: number | string | null | undefined,
    role: string
  ) => void;
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
      setUserId: (id) => set({ userId: Number(id) || null }),

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

      // ✅ accepts any shape of userId (number, string, null, undefined)
      // falls back to JWT decode if value is missing
      setLoginData: (access, refresh, userId, role) => {
        const parsed = Number(userId);
        const resolvedId = !isNaN(parsed) && parsed > 0
          ? parsed
          : userIdFromToken(access);  // fallback: decode from JWT

        set({
          tokenAccess: access,
          tokenRefresh: refresh,
          userId: resolvedId,
          userRole: role,
          isLoggedIn: true,
        });
      },
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