import React from "react"
import { useLanguage } from "@/contexts/language-context"
import { CheckCircle2, Network, BrainCircuit, ShieldCheck } from "lucide-react"

interface PipelineVisualizationProps {
  logAnimationStep: number
}

export const PipelineVisualization: React.FC<PipelineVisualizationProps> = ({ logAnimationStep }) => {
  const { t } = useLanguage()

  // Derived states for the 3 main Pipeline Nodes from animation step
  const isAnalystActive = logAnimationStep >= 1 && logAnimationStep < 5
  const isAnalystComplete = logAnimationStep >= 5
  
  const isResearchActive = logAnimationStep >= 5 && logAnimationStep < 8
  const isResearchComplete = logAnimationStep >= 8
  
  const isTradingActive = logAnimationStep >= 8 && logAnimationStep < 11
  const isTradingComplete = logAnimationStep >= 11

  return (
    <div className="flex flex-col items-center justify-center h-[28%] min-h-[180px] relative w-full mb-4 rounded-2xl border border-border/40 bg-background/30 backdrop-blur-sm overflow-hidden">
      
      <div className="absolute top-4 left-6 text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
        {t("research.pipeline")}
      </div>

      {/* Pipeline Track */}
      <div className="relative flex items-center justify-between w-full max-w-4xl px-12 z-10 scale-90 sm:scale-100">
        
        {/* Node 1: Analyst */}
        <div className="flex flex-col items-center relative z-20">
          <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border rotate-45 transition-all duration-500 ${isAnalystActive ? 'border-cyan-500/50 bg-cyan-950/30 shadow-[0_0_20px_rgba(34,211,238,0.2)] scale-110' : isAnalystComplete ? 'border-cyan-900/50 bg-cyan-950/10' : 'border-border/50 bg-background'}`}>
            <div className="-rotate-45">
              {isAnalystComplete ? <CheckCircle2 className="h-5 w-5 text-cyan-600/70" /> : <Network className={`h-5 w-5 ${isAnalystActive ? 'text-cyan-400 animate-pulse' : 'text-muted-foreground/50'}`} />}
            </div>
          </div>
          <div className="absolute -bottom-10 text-center w-32">
            <span className={`block text-xs font-bold font-mono tracking-widest ${isAnalystActive ? 'text-cyan-400' : isAnalystComplete ? 'text-cyan-700' : 'text-muted-foreground'}`}>{t("research.analysts").toUpperCase()}</span>
            <span className="block text-[9px] font-mono text-muted-foreground/70 uppercase">
              {isAnalystActive 
                ? (t("research.running").includes("...") ? t("research.running") : t("research.running") + "...") 
                : isAnalystComplete ? 'Done' : 'Standby'}
            </span>
          </div>
        </div>

        {/* Line 1 -> 2 */}
        <div className="flex-1 h-[2px] bg-border/40 relative overflow-hidden mx-6 rounded-full">
          <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500/50 to-pink-500/50 transition-transform duration-[2000ms] ease-in-out ${isAnalystComplete ? 'translate-x-0' : '-translate-x-full'}`}></div>
        </div>

        {/* Node 2: Research */}
        <div className="flex flex-col items-center relative z-20">
          <div className={`relative flex h-16 w-16 items-center justify-center rounded-full border transition-all duration-500 ${isResearchActive ? 'border-pink-500/50 bg-pink-950/30 shadow-[0_0_20px_rgba(236,72,153,0.2)] scale-110' : isResearchComplete ? 'border-pink-900/50 bg-pink-950/10' : 'border-border/50 bg-background'}`}>
            {isResearchComplete ? <CheckCircle2 className="h-6 w-6 text-pink-600/70" /> : <BrainCircuit className={`h-6 w-6 ${isResearchActive ? 'text-pink-400 animate-pulse' : 'text-muted-foreground/50'}`} />}
            {isResearchActive && (
              <div className="absolute inset-0 rounded-full border border-pink-400/30 animate-ping opacity-50"></div>
            )}
          </div>
          <div className="absolute -bottom-10 text-center w-32">
            <span className={`block text-xs font-bold font-mono tracking-widest ${isResearchActive ? 'text-pink-400' : isResearchComplete ? 'text-pink-700' : 'text-muted-foreground'}`}>{t("research.researchers").toUpperCase()}</span>
            <span className="block text-[9px] font-mono text-muted-foreground/70 uppercase">{isResearchActive ? 'Debating...' : isResearchComplete ? 'Done' : 'Standby'}</span>
          </div>
        </div>

        {/* Line 2 -> 3 */}
        <div className="flex-1 h-[2px] bg-border/40 relative overflow-hidden mx-6 rounded-full">
          <div className={`absolute inset-0 bg-gradient-to-r from-pink-500/50 to-green-500/50 transition-transform duration-[2000ms] ease-in-out ${isResearchComplete ? 'translate-x-0' : '-translate-x-full'}`}></div>
        </div>

        {/* Node 3: Trading */}
        <div className="flex flex-col items-center relative z-20">
          <div className={`relative flex h-14 w-14 items-center justify-center rounded-xl border transition-all duration-500 ${isTradingActive ? 'border-green-500/50 bg-green-950/30 shadow-[0_0_20px_rgba(34,197,94,0.2)] scale-110' : isTradingComplete ? 'border-green-900/50 bg-green-950/10' : 'border-border/50 bg-background'}`}>
            {isTradingComplete ? <CheckCircle2 className="h-5 w-5 text-green-600/70" /> : <ShieldCheck className={`h-5 w-5 ${isTradingActive ? 'text-green-400 animate-pulse' : 'text-muted-foreground/50'}`} />}
          </div>
          <div className="absolute -bottom-10 text-center w-32">
            <span className={`block text-xs font-bold font-mono tracking-widest ${isTradingActive ? 'text-green-400' : isTradingComplete ? 'text-green-650' : 'text-muted-foreground'}`}>{t("research.trader").toUpperCase()}</span>
            <span className="block text-[9px] font-mono text-muted-foreground/70 uppercase">{isTradingActive ? 'Executing...' : isTradingComplete ? 'Done' : 'Standby'}</span>
          </div>
        </div>

      </div>
    </div>
  )
}
