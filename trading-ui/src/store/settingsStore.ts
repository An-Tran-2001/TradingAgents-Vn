import { create } from "zustand";
import { toast } from "sonner";
import { UserSetting, UpdateUserSettingRequest } from "@/types/settings";
import { settingsApi } from "@/lib/api/settings";
import { ApiError } from "@/lib/api/client";

interface SettingsState {
  settings: UserSetting | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchSettings: () => Promise<void>;
  updateSettings: (data: UpdateUserSettingRequest) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await settingsApi.getSettings();
      set({ settings, isLoading: false });
    } catch (error: any) {
      const message =
        error instanceof ApiError ? error.message : "Không thể tải cấu hình.";
      set({ error: message, isLoading: false });
      toast.error("Tải cấu hình thất bại", { description: message });
    }
  },

  updateSettings: async (data: UpdateUserSettingRequest) => {
    set({ isSaving: true, error: null });
    const loadingToastId = toast.loading("Đang lưu cấu hình...");
    try {
      const updatedSettings = await settingsApi.updateSettings(data);
      set({ settings: updatedSettings, isSaving: false });
      toast.dismiss(loadingToastId);
      toast.success("Lưu cấu hình thành công!", {
        description: "Các thay đổi của bạn đã được lưu an toàn.",
      });
    } catch (error: any) {
      toast.dismiss(loadingToastId);
      const message =
        error instanceof ApiError ? error.message : "Lưu cấu hình thất bại.";
      set({ error: message, isSaving: false });
      toast.error("Lưu cấu hình thất bại", { description: message });
      throw error;
    }
  },
}));
