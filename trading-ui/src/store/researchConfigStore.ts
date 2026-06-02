import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ResearchDepth = "shallow" | "medium" | "deep";
export type ReasoningEffort = "low" | "medium" | "high";
export type AnalystTeam = "fundamentals" | "sentiment" | "news" | "technical";

export interface ResearchConfig {
  // LLM
  provider: string;
  model: string;

  // Research settings
  depth: ResearchDepth;
  reasoningEffort: ReasoningEffort;

  // Analyst teams
  teams: AnalystTeam[];
}

interface ResearchConfigState extends ResearchConfig {
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
  setDepth: (depth: ResearchDepth) => void;
  setReasoningEffort: (effort: ReasoningEffort) => void;
  toggleTeam: (team: AnalystTeam) => void;
  setTeams: (teams: AnalystTeam[]) => void;
  reset: () => void;
}

const DEFAULT_CONFIG: ResearchConfig = {
  provider: "openai",
  model: "",
  depth: "medium",
  reasoningEffort: "high",
  teams: ["fundamentals", "sentiment", "news", "technical"],
};

export const useResearchConfigStore = create<ResearchConfigState>()(
  persist(
    (set) => ({
      ...DEFAULT_CONFIG,

      setProvider: (provider) =>
        set({ provider, model: "" }), // reset model when provider changes

      setModel: (model) => set({ model }),

      setDepth: (depth) => set({ depth }),

      setReasoningEffort: (reasoningEffort) => set({ reasoningEffort }),

      toggleTeam: (team) =>
        set((state) => ({
          teams: state.teams.includes(team)
            ? state.teams.filter((t) => t !== team)
            : [...state.teams, team],
        })),

      setTeams: (teams) => set({ teams }),

      reset: () => set(DEFAULT_CONFIG),
    }),
    {
      name: "research-config", // localStorage key
      version: 1,
    }
  )
);
