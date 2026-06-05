import React, { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useLanguage } from "@/contexts/language-context"
import {
  History,
  BrainCircuit,
  LineChart,
  Newspaper,
  BarChart3,
  Sparkles,
  User,
  Activity,
  Send,
  BookOpen,
  Users,
  Globe,
  MousePointerClick,
  ShieldCheck,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Message } from "./types"
import { motion, AnimatePresence } from "framer-motion"
import { StockChartWidget } from "./widgets/StockChartWidget"
import { FinancialChartWidget } from "./widgets/FinancialChartWidget"
import { FlowChartWidget } from "./widgets/FlowChartWidget"
const useSmoothText = (text: string) => {
  const [displayedText, setDisplayedText] = useState(text);
  const textRef = useRef(text);
  const displayedRef = useRef(displayedText);

  // Keep target text updated without restarting the effect
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    const FRAME_MS = 1000 / 40; // ~40 FPS

    const updateText = (time: number) => {
      if (time - lastTime >= FRAME_MS) {
        setDisplayedText((current) => {
          const target = textRef.current;
          
          // Snap immediately if target is completely different or shrunk
          if (target.length < current.length) {
            displayedRef.current = target;
            return target;
          }
          
          // Snap if it's a huge initial load
          if (current.length === 0 && target.length > 500) {
            displayedRef.current = target;
            return target;
          }
          
          if (current.length >= target.length) {
            return current;
          }
          
          const remaining = target.length - current.length;
          // Capped acceleration to keep the typing effect even on large chunks
          const step = Math.min(10, Math.max(1, Math.ceil(remaining / 8))); 
          const next = target.slice(0, current.length + step);
          displayedRef.current = next;
          return next;
        });
        lastTime = time;
      }
      animationFrameId = requestAnimationFrame(updateText);
    };

    animationFrameId = requestAnimationFrame(updateText);
    return () => cancelAnimationFrame(animationFrameId);
  }, []); // Run only once

  return displayedText;
};

const MessageBubble = React.memo(({ msg }: { msg: Message }) => {
  const rawContent = typeof msg.content === 'string' ? msg.content : "";
  const smoothedContent = useSmoothText(rawContent);
  
  let contentStr = typeof msg.content === 'string' ? smoothedContent : "";
  if (typeof msg.content === 'string') {
    const codeBlockCount = (contentStr.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
      contentStr += '\n```';
    }
  }

  const isAgent = msg.role === "agent"
  const isUser = msg.role === "user"
  const isJSX = typeof msg.content !== 'string'

  return (
    <div
      className={`flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
    >
      {/* Avatar */}
      <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        isUser
          ? "bg-muted text-muted-foreground"
          : isAgent
          ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
          : "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)]"
      }`}>
        {isUser ? <User className="h-4 w-4" /> : isAgent ? <Users className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
      </div>

      {/* Message Bubble */}
      <div className={`flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"} ${isJSX ? "w-full" : "w-full max-w-[85%]"}`}>
        <div className="flex items-center gap-2 px-1">
          <span className={`text-sm font-semibold ${isAgent ? "text-emerald-400" : ""}`}>
            {isUser ? "You" : msg.agentRole || "Assistant"}
          </span>
          {isAgent && (
            <span className="text-[10px] text-muted-foreground bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-full">Research Team</span>
          )}
        </div>
        <div
          className={`text-[15px] leading-relaxed w-full prose prose-sm dark:prose-invert max-w-none ${
            isUser
              ? "bg-muted/50 px-5 py-3.5 rounded-2xl rounded-tr-sm inline-block w-auto"
              : isJSX
              ? "bg-card/40 backdrop-blur-sm border border-border/50 px-4 py-4 rounded-2xl rounded-tl-sm shadow-sm"
              : "bg-card/40 backdrop-blur-sm border border-border/50 px-6 py-5 rounded-2xl rounded-tl-sm shadow-sm"
          }`}
        >
          {typeof msg.content === 'string' ? (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-4 rounded-lg border border-border/50">
                    <table className="w-full text-sm text-left" {...props} />
                  </div>
                ),
                thead: ({node, ...props}) => <thead className="bg-muted/50 text-xs uppercase" {...props} />,
                th: ({node, ...props}) => <th className="px-4 py-3 font-medium text-foreground" {...props} />,
                td: ({node, ...props}) => <td className="px-4 py-3 border-t border-border/50 text-muted-foreground" {...props} />,
                a: ({node, href, children, ...props}) => {
                  if (href?.startsWith('citation:')) {
                    return (
                      <div className="my-3 block">
                        <a href={href} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all no-underline cursor-pointer group shadow-sm" {...props}>
                          <BookOpen className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span className="font-medium text-sm">{children}</span>
                        </a>
                      </div>
                    );
                  }
                  return <a href={href} className="text-primary hover:underline font-medium" {...props}>{children}</a>;
                },
                pre: ({node, ...props}) => {
                  const childrenArray = React.Children.toArray(props.children);
                  const firstChild = childrenArray[0] as React.ReactElement;
                  if (
                    firstChild && 
                    firstChild.props && 
                    firstChild.props.className === 'language-widget'
                  ) {
                    return <>{props.children}</>;
                  }
                  return (
                    <div className="my-4 rounded-lg overflow-hidden border border-border/50 bg-background/50 shadow-sm">
                      <pre className="p-4 overflow-x-auto text-sm" {...props} />
                    </div>
                  );
                },
                code: ({node, className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || '')
                  if (match && match[1] === 'widget') {
                    try {
                      const data = JSON.parse(String(children).replace(/\n$/, ''));
                      if (data.type === 'stock_chart') {
                        return <StockChartWidget data={data} />;
                      }
                      if (data.type === 'financial_chart') {
                        return <FinancialChartWidget data={data} />;
                      }
                      if (data.type === 'flow_chart') {
                        return <FlowChartWidget data={data} />;
                      }
                    } catch(e) {
                      console.error("Failed to parse widget data", e);
                    }
                  }
                  return (
                    <code className={`${className || ''} bg-muted/50 text-primary px-1.5 py-0.5 rounded text-[13px] font-mono`} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {contentStr}
            </ReactMarkdown>
          ) : (
            msg.content
          )}
        </div>
        <span className="text-xs text-muted-foreground px-1">{msg.timestamp}</span>
      </div>
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';

interface ChatInterfaceProps {
  messages: Message[]
  isTyping: boolean
  isHistoryOpen: boolean
  setIsHistoryOpen: (open: boolean) => void
  onSend: (text: string, ticker?: string) => void
  activeTool?: string | null
  activeToolArgs?: any
  currentBrowserUrl?: string | null
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isTyping,
  isHistoryOpen,
  setIsHistoryOpen,
  onSend,
  activeTool,
  activeToolArgs,
  currentBrowserUrl
}) => {
  const { t } = useLanguage()
  const [inputValue, setInputValue] = useState("")
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true)

  // Track if user manually scrolls up
  const handleScroll = () => {
    if (!chatScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setIsAutoScrollEnabled(isNearBottom);
  };

  // Robust Auto-scroll chat using MutationObserver to catch all text additions
  useEffect(() => {
    const scrollEl = chatScrollRef.current;
    if (!scrollEl) return;

    const scrollToBottomIfNear = () => {
      if (isAutoScrollEnabled) {
        scrollEl.scrollTop = scrollEl.scrollHeight;
      }
    };

    // Observe all DOM mutations in the chat container
    const observer = new MutationObserver(() => {
      scrollToBottomIfNear();
    });

    const innerContainer = scrollEl.firstElementChild;
    if (innerContainer) {
      observer.observe(innerContainer, { childList: true, subtree: true, characterData: true });
    }

    return () => observer.disconnect();
  }, [isAutoScrollEnabled]);

  // Force scroll to bottom when a brand new message arrives
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      setIsAutoScrollEnabled(true); // Re-enable auto scroll on new message
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!inputValue.trim()) return
    onSend(inputValue)
    setInputValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (text: string, suggestedTicker: string) => {
    onSend(text, suggestedTicker)
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      
      {/* History Toggle Button */}
      {!isHistoryOpen && (
        <div className="absolute top-4 left-4 z-20">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsHistoryOpen(true)} 
            className="gap-2 bg-background/50 backdrop-blur border-primary/20 hover:bg-primary/10 hover:text-primary text-muted-foreground h-9"
          >
            <History className="h-4 w-4" />
            History
          </Button>
        </div>
      )}

      {/* Chat Messages */}
      <div 
        ref={chatScrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-32">
          
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center text-center mt-12 animate-in fade-in zoom-in duration-500">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/30 shadow-[0_0_40px_rgba(var(--primary),0.25)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20"></div>
                <BrainCircuit className="h-10 w-10 relative z-10 group-hover:scale-110 transition-transform" />
              </div>
              <h1 className="mb-2 text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                {t("research.welcomeTitle")}
              </h1>
              <p className="mb-8 text-muted-foreground max-w-md text-[15px]">
                {t("research.welcomeDesc")}
              </p>
              
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                <button 
                  onClick={() => handleSuggestionClick("Perform a comprehensive technical analysis on AAPL", "AAPL")}
                  className="flex flex-col items-start gap-1 rounded-xl border border-primary/10 bg-card/40 backdrop-blur-md p-4 text-left transition-all hover:bg-card/80 hover:shadow-[0_0_20px_rgba(var(--primary),0.1)] hover:border-primary/40 hover:-translate-y-1 group"
                >
                  <span className="font-medium flex items-center gap-2"><LineChart className="h-4 w-4 text-primary" /> Technical Analysis</span>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">Analyze MACD, RSI, and trends for AAPL</span>
                </button>
                <button 
                  onClick={() => handleSuggestionClick("Check the recent market sentiment and news for TSLA", "TSLA")}
                  className="flex flex-col items-start gap-1 rounded-xl border border-primary/10 bg-card/40 backdrop-blur-md p-4 text-left transition-all hover:bg-card/80 hover:shadow-[0_0_20px_rgba(var(--primary),0.1)] hover:border-primary/40 hover:-translate-y-1 group"
                >
                  <span className="font-medium flex items-center gap-2"><Newspaper className="h-4 w-4 text-primary" /> Market Sentiment</span>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">Scan news and social media for TSLA</span>
                </button>
                <button 
                  onClick={() => handleSuggestionClick("Give me a fundamental breakdown of NVDA's last earnings", "NVDA")}
                  className="flex flex-col items-start gap-1 rounded-xl border border-primary/10 bg-card/40 backdrop-blur-md p-4 text-left transition-all hover:bg-card/80 hover:shadow-[0_0_20px_rgba(var(--primary),0.1)] hover:border-primary/40 hover:-translate-y-1 group"
                >
                  <span className="font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Fundamentals</span>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">Review earnings & valuation for NVDA</span>
                </button>
                <button 
                  onClick={() => handleSuggestionClick("Run a full multi-agent debate on the crypto market", "BTC-USD")}
                  className="flex flex-col items-start gap-1 rounded-xl border border-primary/10 bg-card/40 backdrop-blur-md p-4 text-left transition-all hover:bg-card/80 hover:shadow-[0_0_20px_rgba(var(--primary),0.1)] hover:border-primary/40 hover:-translate-y-1 group"
                >
                  <span className="font-medium flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Full Team Debate</span>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">Bull vs Bear analysis on BTC-USD</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
            </div>
          )}
          
          {/* Typing Indicator */}
          {isTyping && (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex gap-4 flex-row"
            >
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)]">
                <Activity className="h-4 w-4" />
              </div>
              <div className="flex flex-col gap-1.5 items-start w-full max-w-[85%]">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-sm font-semibold">Tauric Nexus</span>
                </div>
                <div className="bg-card/40 backdrop-blur-sm border border-border/50 px-6 py-4 rounded-2xl rounded-tl-sm shadow-sm flex flex-col items-start justify-center gap-2 min-h-[62px]">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"></div>
                  </div>
                  {activeTool && !activeTool.startsWith("browser_") && (
                    <div className="text-xs text-primary/80 mt-1 flex items-center gap-1.5 animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Running tool: <code className="bg-black/40 px-1 py-0.5 rounded text-[11px] font-mono text-cyan-300">{activeTool}</code>...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Mini Screen Dialog for Browser Actions */}
          {activeTool && activeTool.startsWith("browser_") && (
            <motion.div 
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="ml-[48px] mr-auto mt-2 w-full max-w-[700px] origin-top"
            >
              <div className="flex flex-col items-center justify-center h-[380px] relative w-full rounded-2xl border border-emerald-500/40 bg-emerald-950/20 backdrop-blur-xl overflow-hidden p-3 sm:p-4 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                
                <div className="absolute top-2 right-4 text-[10px] font-mono text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]"></span>
                  LIVE BROWSER
                </div>
                
                <div className="w-full h-full mt-4 border border-border/60 rounded-xl bg-background/95 shadow-2xl overflow-hidden flex flex-col relative transform-gpu">
                  
                  {/* Browser Header */}
                  <div className="h-10 bg-muted/80 border-b border-border/50 flex items-center px-4 gap-3 backdrop-blur-md">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors cursor-pointer"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors cursor-pointer"></div>
                    </div>
                    
                    {/* Navigation Buttons */}
                    <div className="flex gap-2 ml-2 text-muted-foreground">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="m9 18 6-6-6-6"/></svg>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v6h6"/></svg>
                    </div>

                    {/* Address Bar */}
                    <div className="mx-auto flex-1 max-w-xl h-7 bg-background/90 border border-border/60 rounded-md flex items-center px-3 shadow-inner overflow-hidden relative group">
                       <div className={`absolute inset-0 bg-emerald-500/10 transition-transform duration-[1500ms] ease-out ${activeTool === 'browser_navigate_browser' ? 'translate-x-0' : '-translate-x-full'}`}></div>
                       <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 mr-2 opacity-70" />
                       <span className="text-[11px] text-foreground/80 font-mono truncate relative z-10 w-full select-none">
                         {currentBrowserUrl || "https://financial-data.web..."}
                       </span>
                    </div>
                  </div>
                  
                  {/* Webpage Content Body */}
                  <div className="flex-1 relative bg-card overflow-hidden flex">
                    
                    {/* Main Content */}
                    <div className="flex-1 p-0 overflow-hidden flex flex-col relative bg-white group">
                      
                      {currentBrowserUrl ? (
                        <>
                          <div className="absolute inset-0 bg-white flex flex-col items-center justify-center animate-pulse z-0">
                            <ShieldCheck className="w-6 h-6 text-emerald-500 mb-2 opacity-50" />
                            <span className="text-xs text-muted-foreground font-mono">Intercepting Visual DOM...</span>
                            <span className="text-[10px] text-muted-foreground/60 font-mono mt-1">Generating Snapshot...</span>
                          </div>
                          <img 
                            key={currentBrowserUrl}
                            src={`https://api.microlink.io/?url=${encodeURIComponent(currentBrowserUrl)}&screenshot=true&meta=false&embed=screenshot.url`}
                            className="absolute inset-0 w-full h-full object-cover z-10 border-0 opacity-90 grayscale-[0.2]"
                            alt="Live Web View"
                            onError={(e) => {
                              // If screenshot fails, hide the image and show skeletons below
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </>
                      ) : null}
                      
                      {/* Fallback Skeletons (Shown behind image or if image fails) */}
                      <div className="absolute inset-0 p-6 w-full h-full z-0 pointer-events-none">
                          <div className="w-2/3 h-8 bg-muted/60 rounded-md mb-6 relative overflow-hidden">
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]"></div>
                          </div>
                          
                          {/* Financial Chart Skeleton */}
                          <div className="w-full h-[100px] border border-border/40 bg-muted/10 rounded-lg mb-6 flex items-end p-2 gap-2 relative">
                            <div className="w-1/6 h-[30%] bg-blue-500/20 rounded-t-sm"></div>
                            <div className="w-1/6 h-[50%] bg-blue-500/30 rounded-t-sm"></div>
                            <div className="w-1/6 h-[40%] bg-blue-500/20 rounded-t-sm"></div>
                            <div className="w-1/6 h-[80%] bg-blue-500/40 rounded-t-sm relative">
                              {/* Click Target */}
                              {(activeTool === "browser_click_element" || activeTool === "browser_get_elements") && (
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 border-2 border-emerald-400 rounded-full animate-ping opacity-80"></div>
                              )}
                            </div>
                            <div className="w-1/6 h-[60%] bg-blue-500/30 rounded-t-sm"></div>
                            <div className="w-1/6 h-[90%] bg-blue-500/50 rounded-t-sm"></div>
                          </div>

                          {/* Text Paragraphs */}
                          <div className="space-y-3 relative group">
                            <div className="w-full h-3 bg-muted/40 rounded-sm"></div>
                            <div className="w-[95%] h-3 bg-muted/40 rounded-sm"></div>
                            <div className="w-[85%] h-3 bg-muted/40 rounded-sm"></div>
                            <div className="w-full h-3 bg-muted/40 rounded-sm"></div>
                            <div className="w-[70%] h-3 bg-muted/40 rounded-sm"></div>
                          </div>
                        </div>
                      
                      {/* Text Highlighting Animation */}
                      {(activeTool === "browser_extract_text" || activeTool === "browser_extract_html" || activeTool === "browser_extract_hyperlinks") && (
                        <div className="absolute top-[30%] left-[5%] right-[5%] h-[40%] bg-emerald-500/10 border border-emerald-500/50 rounded-lg flex items-center justify-center animate-in fade-in zoom-in-95 duration-500 z-20 pointer-events-none">
                           <div className="absolute top-0 left-0 h-full w-[4px] bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                           <span className="text-[11px] text-emerald-400 font-mono bg-background/95 px-3 py-1.5 rounded border border-emerald-500/50 backdrop-blur flex items-center gap-2 shadow-lg">
                             <Search className="w-3.5 h-3.5 animate-pulse" /> Intercepting & Extracting Real Data Nodes...
                           </span>
                        </div>
                      )}

                      {/* Fake Mouse Pointer */}
                      <div 
                         className={`absolute z-50 flex flex-col items-center pointer-events-none transition-all duration-[1200ms] ease-out drop-shadow-2xl
                          ${activeTool === 'browser_navigate_browser' ? 'top-[-35px] left-[50%]' : 
                            activeTool.includes('extract') ? 'top-[220px] left-[40%]' : 
                            activeTool.includes('click') || activeTool.includes('get_elements') ? 'top-[125px] left-[62%]' : 
                            'top-[50%] left-[50%]'}`}
                      >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z" fill="black" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="relative z-20 mx-auto w-full max-w-3xl p-4 sm:p-6 pb-6 pt-0">
        <div className="relative flex items-center rounded-2xl border border-primary/20 bg-background/80 shadow-[0_0_30px_rgba(var(--primary),0.05)] backdrop-blur-xl focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
          <Button variant="ghost" size="icon" className="ml-2 h-10 w-10 shrink-0 text-muted-foreground hover:text-primary rounded-xl">
            <Search className="h-5 w-5" />
          </Button>
          <input
            type="text"
            placeholder={t("research.welcomePromptPlaceholder")}
            className="flex h-14 w-full bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:outline-none"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button 
            onClick={handleSend} 
            size="icon" 
            disabled={!inputValue.trim() || isTyping}
            className="mr-2 h-10 w-10 shrink-0 rounded-xl bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(var(--primary),0.5)] transition-all disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 text-center">
          <span className="text-xs text-muted-foreground">
            {t("research.disclaimer")}
          </span>
        </div>
      </div>
    </div>
  )
}
