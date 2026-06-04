import { fetchClient } from "./client";
import { UserSetting, UpdateUserSettingRequest } from "@/types/settings";

export const settingsApi = {
  getSettings: async (): Promise<UserSetting> => {
    return fetchClient("/users/settings", {
      method: "GET",
    });
  },

  updateSettings: async (data: UpdateUserSettingRequest): Promise<UserSetting> => {
    return fetchClient("/users/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};
