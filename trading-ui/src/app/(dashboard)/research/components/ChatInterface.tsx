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
  Search, 
  Send,
  BookOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Message } from "./types"

interface ChatInterfaceProps {
  messages: Message[]
  isTyping: boolean
  isHistoryOpen: boolean
  setIsHistoryOpen: (open: boolean) => void
  onSend: (text: string, ticker?: string) => void
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isTyping,
  isHistoryOpen,
  setIsHistoryOpen,
  onSend,
}) => {
  const { t } = useLanguage()
  const [inputValue, setInputValue] = useState("")
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current && !isTyping) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

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
        className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth custom-scrollbar"
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
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-in fade-in slide-in-from-bottom-2`}>
                
                {/* Avatar */}
                <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  msg.role === "user" 
                    ? "bg-muted text-muted-foreground" 
                    : "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)]"
                }`}>
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"} w-full max-w-[85%]`}>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-sm font-semibold">
                      {msg.role === "user" ? "You" : msg.agentRole}
                    </span>
                  </div>
                  <div className={`text-[15px] leading-relaxed w-full prose prose-sm dark:prose-invert max-w-none ${
                    msg.role === "user"
                      ? "bg-muted/50 px-5 py-3.5 rounded-2xl rounded-tr-sm inline-block w-auto"
                      : "bg-card/40 backdrop-blur-sm border border-border/50 px-6 py-5 rounded-2xl rounded-tl-sm shadow-sm"
                  }`}>
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
                          pre: ({node, ...props}) => (
                            <div className="my-4 rounded-lg overflow-hidden border border-border/50 bg-background/50 shadow-sm">
                              <pre className="p-4 overflow-x-auto text-sm" {...props} />
                            </div>
                          ),
                          code: ({node, className, children, ...props}) => {
                            return (
                              <code className={`${className || ''} bg-muted/50 text-primary px-1.5 py-0.5 rounded text-[13px] font-mono`} {...props}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground px-1">{msg.timestamp}</span>
                </div>
              </div>
            ))
          )}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-4 flex-row animate-in fade-in slide-in-from-bottom-2">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)]">
                <Activity className="h-4 w-4" />
              </div>
              <div className="flex flex-col gap-1.5 items-start w-full max-w-[85%]">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-sm font-semibold">Tauric Nexus</span>
                </div>
                <div className="bg-card/40 backdrop-blur-sm border border-border/50 px-6 py-5 rounded-2xl rounded-tl-sm shadow-sm flex items-center h-[62px]">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"></div>
                  </div>
                </div>
              </div>
            </div>
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
