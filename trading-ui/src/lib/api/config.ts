import { fetchClient } from "./client";

export interface ProviderInfo {
  id: string;
  name: string;
  base_url: string | null;
  requires_api_key: boolean;
  is_ready: boolean;
  regions?: string[];
}

export interface ModelInfo {
  id: string;
  name: string;
  mode: "quick" | "deep";
}

export interface ProviderDetailResponse {
  provider: ProviderInfo;
  models: ModelInfo[];
}

export const configApi = {
  getProviders: async (): Promise<ProviderInfo[]> => {
    return fetchClient("/config/providers", { method: "GET" });
  },

  getProviderModels: async (providerId: string): Promise<ProviderDetailResponse> => {
    return fetchClient(`/config/providers/${providerId}/models`, { method: "GET" });
  },
};
