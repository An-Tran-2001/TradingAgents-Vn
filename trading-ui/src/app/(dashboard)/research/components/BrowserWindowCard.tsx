import React, { useEffect, useRef, useState, useCallback } from "react"
import { ShieldAlert, Search } from "lucide-react"

interface BrowserWindowCardProps {
  browserId: string
  b: { tool: string; args: any; url: string; timestamp?: number }
  isMulti: boolean
  index?: number  // position in the list — used to stagger microlink requests
}

// How long to wait before making the first screenshot request.
// Stagger by index to avoid all 6 browsers hitting microlink simultaneously.
// microlink free tier allows ~1 req/s before rate-limiting.
const SCREENSHOT_STAGGER_MS = 2500  // 0, 2.5s, 5s, 7.5s, 10s, 12.5s for 6 browsers
const SCREENSHOT_RETRY_MS = 20000   // retry a failed screenshot after 20s

export const BrowserWindowCard: React.FC<BrowserWindowCardProps> = ({ browserId, b, isMulti, index = 0 }) => {
  // screenshotSrc: null = pending/not-started, string = URL being loaded or loaded
  const [screenshotSrc, setScreenshotSrc] = useState<string | null>(null)
  const [screenshotOk, setScreenshotOk] = useState(false)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const buildMicrolinkUrl = useCallback((pageUrl: string) =>
    `https://api.microlink.io/?url=${encodeURIComponent(pageUrl)}&screenshot=true&meta=false&embed=screenshot.url`,
  [])

  // Every time the URL changes:
  //  1. Reset state
  //  2. Schedule the request with a per-index stagger so 6 browsers don't
  //     all hit microlink.io at the same instant and trigger rate limiting.
  useEffect(() => {
    if (!b.url) return
    setScreenshotSrc(null)
    setScreenshotOk(false)
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)

    const delay = index * SCREENSHOT_STAGGER_MS
    const timer = setTimeout(() => {
      setScreenshotSrc(buildMicrolinkUrl(b.url))
    }, delay)
    return () => {
      clearTimeout(timer)
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [b.url, index, buildMicrolinkUrl])

  const handleLoad = useCallback(() => setScreenshotOk(true), [])

  // On error: keep skeleton visible, then auto-retry after SCREENSHOT_RETRY_MS.
  // This handles transient microlink rate-limits that clear after a few seconds.
  const handleError = useCallback(() => {
    setScreenshotOk(false)
    setScreenshotSrc(null)  // hide broken img, show skeleton
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    retryTimerRef.current = setTimeout(() => {
      // Rebuild the microlink URL with a cache-busting timestamp so the
      // browser doesn't serve the cached 4xx response.
      setScreenshotSrc(buildMicrolinkUrl(b.url) + `&_t=${Date.now()}`)
    }, SCREENSHOT_RETRY_MS)
  }, [b.url, buildMicrolinkUrl])

  const toolLabel = b.tool?.replace("browser_", "").replace(/_/g, " ").toUpperCase() || "SCANNING DOM..."

  return (
    <div className={`flex flex-col relative rounded-2xl border border-emerald-500/40 bg-emerald-950/20 backdrop-blur-xl overflow-hidden p-3 sm:p-4 shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-in zoom-in-95 duration-500 ${isMulti ? "w-full lg:w-[46%] max-w-[650px]" : "w-[90%] max-w-[900px]"}`}>

      <div className="absolute top-2 right-4 text-[10px] font-mono text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]"></span>
        LIVE BROWSER {browserId.slice(0, 4)}
      </div>

      <div className="w-full aspect-video mt-6 border border-border/60 rounded-xl bg-background/95 shadow-2xl overflow-hidden flex flex-col relative transform-gpu">
        {/* Browser chrome header */}
        <div className="h-10 bg-muted/80 border-b border-border/50 flex items-center px-4 gap-3 backdrop-blur-md flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors cursor-pointer"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors cursor-pointer"></div>
          </div>
          {/* Address bar */}
          <div className="mx-auto flex-1 max-w-xl h-7 bg-background/90 border border-border/60 rounded-md flex items-center px-3 shadow-inner overflow-hidden relative group">
            <div className={`absolute inset-0 bg-emerald-500/10 transition-transform duration-[1500ms] ease-out ${b.tool === "browser_navigate_browser" ? "translate-x-0" : "-translate-x-full"}`}></div>
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-500 mr-2 opacity-70 flex-shrink-0" />
            <span className="text-[11px] text-foreground/80 font-mono truncate relative z-10 w-full select-none">
              {b.url}
            </span>
          </div>
        </div>

        {/* Browser viewport */}
        <div className="flex-1 overflow-hidden relative bg-[#0d1117]">

          {/* ── Layer 1 (always visible): animated DOM skeleton ── */}
          <div className="absolute inset-0 z-10 flex flex-col bg-[#0d1117] overflow-hidden">
            <div className="flex-1 p-4 space-y-3 overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-4 h-4 text-emerald-500 animate-pulse" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="w-2/3 h-3 bg-emerald-500/20 rounded animate-pulse" />
                  <div className="w-1/2 h-2 bg-emerald-500/10 rounded animate-pulse" />
                </div>
              </div>
              {[100, 90, 95, 85, 75, 88].map((w, i) => (
                <div key={i} className="h-2.5 bg-emerald-900/40 rounded animate-pulse"
                  style={{ width: `${w}%`, animationDelay: `${i * 150}ms` }} />
              ))}
              <div className="mt-4 p-3 border border-emerald-500/30 rounded-lg bg-emerald-950/40">
                <div className="text-[9px] font-mono text-emerald-400 mb-2 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {toolLabel}
                </div>
                {[60, 80, 50].map((w, i) => (
                  <div key={i} className="h-2 bg-emerald-400/30 rounded mb-1.5 animate-pulse"
                    style={{ width: `${w}%`, animationDelay: `${i * 200}ms` }} />
                ))}
              </div>
              {[95, 80, 70].map((w, i) => (
                <div key={`b${i}`} className="h-2.5 bg-emerald-900/30 rounded animate-pulse"
                  style={{ width: `${w}%`, animationDelay: `${(i + 7) * 150}ms` }} />
              ))}
            </div>
            <div className="px-3 py-1.5 bg-emerald-950/50 border-t border-emerald-500/20 flex items-center gap-2 flex-shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
              <span className="text-[9px] font-mono text-emerald-400/70 truncate flex-1">{b.url}</span>
              {/* Screenshot status */}
              <span className="text-[8px] font-mono flex-shrink-0">
                {screenshotOk
                  ? <span className="text-emerald-400">● LIVE</span>
                  : screenshotSrc
                  ? <span className="text-yellow-400/70 animate-pulse">◌ CAPTURING...</span>
                  : index === 0
                  ? <span className="text-sky-400/70 animate-pulse">◌ QUEUED</span>
                  : <span className="text-slate-500">◌ +{((index * 2.5)).toFixed(0)}s</span>
                }
              </span>
            </div>
          </div>

          {/* ── Layer 2 (conditional): real screenshot from microlink ── */}
          {/* Rendered declaratively via React state — no imperative style mutations */}
          {screenshotSrc && (
            <img
              key={screenshotSrc}
              src={screenshotSrc}
              className={`absolute inset-0 w-full h-full object-cover border-0 transition-opacity duration-500 ${screenshotOk ? "opacity-100 z-20" : "opacity-0 z-0"}`}
              alt="Live Web View"
              onLoad={handleLoad}
              onError={handleError}
            />
          )}

          {/* Tool-specific animation overlays (z-30, always above screenshot) */}
          {(b.tool === "browser_extract_text" || b.tool === "browser_extract_html" || b.tool === "browser_extract_hyperlinks" || b.tool === "get_vietnam_macro" || b.tool === "browser_get_dom_snippet") && (
            <div className="absolute top-[30%] left-[5%] right-[5%] h-[40%] bg-emerald-500/10 border border-emerald-500/50 rounded-lg flex items-center justify-center animate-in fade-in zoom-in-95 duration-500 z-30 pointer-events-none">
              <div className="absolute top-0 left-0 h-full w-[4px] bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <span className="text-[11px] text-emerald-400 font-mono bg-background/95 px-3 py-1.5 rounded border border-emerald-500/50 backdrop-blur flex items-center gap-2 shadow-lg">
                <Search className="w-3.5 h-3.5 animate-pulse" /> Intercepting &amp; Extracting Real Data Nodes...
              </span>
            </div>
          )}
          {(b.tool === "browser_click_element" || b.tool === "browser_get_elements" || b.tool === "browser_hover_element" || b.tool === "browser_fill_element" || b.tool === "browser_select_option" || b.tool === "browser_check_checkbox") && (
            <div className="absolute top-[40%] left-[62%] z-30">
              <div className="w-6 h-6 border-2 border-emerald-400 rounded-full animate-ping opacity-80 absolute -top-3 -left-3" />
              <div className="w-2 h-2 bg-emerald-400 rounded-full absolute -top-1 -left-1" />
            </div>
          )}
          {/* Mouse pointer */}
          <div className={`absolute z-40 flex flex-col items-center pointer-events-none transition-all duration-[1200ms] ease-out drop-shadow-2xl
            ${b.tool === "browser_navigate_browser" ? "top-[-35px] left-[50%]" :
              b.tool?.includes("extract") || b.tool === "get_vietnam_macro" || b.tool === "browser_get_dom_snippet" ? "top-[220px] left-[40%]" :
              b.tool?.includes("click") || b.tool?.includes("get_elements") || b.tool?.includes("hover_") || b.tool?.includes("fill_") || b.tool?.includes("select_") || b.tool?.includes("check_") ? "top-[40%] left-[62%]" :
              b.tool === "browser_scroll_browser" ? "top-[50%] left-[95%] animate-bounce" :
              "top-[50%] left-[50%]"}`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z" fill="black" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
