export interface UserSetting {
  id: number;
  user_id: number;
  api_keys: Record<string, string> | null;
  llm_provider: string;
  deep_think_model: string;
  quick_think_model: string;
  language: string;
  max_debate_rounds: number;
  max_risk_rounds: number;
  temperature: number;
  llm_backend_url: string | null;
  checkpoint_enabled: boolean;
}

export interface UpdateUserSettingRequest {
  api_keys?: Record<string, string>;
  llm_provider?: string;
  deep_think_model?: string;
  quick_think_model?: string;
  language?: string;
  max_debate_rounds?: number;
  max_risk_rounds?: number;
  temperature?: number;
  llm_backend_url?: string | null;
  checkpoint_enabled?: boolean;
}
