import { create } from "zustand";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { User, LoginCredentials } from "@/types/auth";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!Cookies.get("access_token"),
  isLoading: false,
  error: null,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    const loadingToastId = toast.loading("Đang xác thực...", {
      description: "Vui lòng chờ trong giây lát.",
    });
    try {
      const data = await authApi.login(credentials);
      Cookies.set("access_token", data.access_token, {
        expires: 7,
        secure: process.env.NODE_ENV === "production",
      });

      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });

      toast.dismiss(loadingToastId);
      toast.success("Đăng nhập thành công!", {
        description: `Chào mừng trở lại, ${user.email}!`,
      });
    } catch (error: any) {
      toast.dismiss(loadingToastId);
      const message =
        error instanceof ApiError ? error.message : "Đăng nhập thất bại.";
      set({ error: message, isLoading: false });
      toast.error("Đăng nhập thất bại", { description: message });
      throw error;
    }
  },

  logout: () => {
    Cookies.remove("access_token");
    set({ user: null, isAuthenticated: false });
    toast.info("Đã đăng xuất", { description: "Hẹn gặp lại bạn!" });
  },

  fetchUser: async () => {
    const token = Cookies.get("access_token");
    if (!token) return;

    set({ isLoading: true });
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      Cookies.remove("access_token");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
