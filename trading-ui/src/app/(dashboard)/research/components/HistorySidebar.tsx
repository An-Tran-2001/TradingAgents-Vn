import React, { useEffect, useState } from "react"
import { History, Plus, X, Pencil, Trash, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { agentChatsApi } from "@/lib/api/agent_chats"

interface HistorySidebarProps {
  isOpen: boolean
  onClose: () => void
  onSelectSession?: (sessionId: number) => void
  onNewChat?: () => void
  refreshTrigger?: number
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, onSelectSession, onNewChat, refreshTrigger }) => {
  const [sessions, setSessions] = useState<any[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const loadSessions = () => {
    agentChatsApi.getSessions()
      .then(data => setSessions(data))
      .catch(err => console.error("Failed to load sessions", err))
  }

  useEffect(() => {
    if (isOpen || refreshTrigger) {
      loadSessions()
    }
  }, [isOpen, refreshTrigger])

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this chat history?")) {
      try {
        await agentChatsApi.deleteSession(id)
        loadSessions()
        // If current session is deleted, trigger new chat
        if (onNewChat) onNewChat()
      } catch (error) {
        console.error("Failed to delete session", error)
      }
    }
  }

  const handleEditStart = (e: React.MouseEvent, id: number, currentTitle: string) => {
    e.stopPropagation()
    setEditingId(id)
    setEditTitle(currentTitle)
  }

  const handleEditSave = async (e: React.MouseEvent | React.KeyboardEvent, id: number) => {
    e.stopPropagation()
    if (!editTitle.trim()) return
    try {
      await agentChatsApi.updateSession(id, editTitle)
      setEditingId(null)
      loadSessions()
    } catch (error) {
      console.error("Failed to update session", error)
    }
  }

  const handleEditCancel = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    setEditingId(null)
  }

  return (
    <div 
      className={`flex flex-col bg-background/80 backdrop-blur-md transition-all duration-300 z-20 overflow-hidden shrink-0 ${
        isOpen ? "w-72 border-r border-border/50" : "w-0 border-r-0"
      }`}
    >
      <div className="p-4 border-b border-border/50 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 w-72">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Chat History</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={onNewChat}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 w-72 custom-scrollbar">
        <div className="p-3 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8">No chat history found.</div>
          ) : (
            sessions.map((hist) => (
              <div 
                key={hist.id}
                onClick={() => {
                  if (editingId !== hist.id && onSelectSession) onSelectSession(hist.id)
                }}
                className="p-3 rounded-xl border border-primary/10 bg-card/30 hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer group relative"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{hist.ticker || "N/A"}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(hist.created_at).toLocaleDateString()}</span>
                </div>
                {editingId === hist.id ? (
                  <div className="flex items-center gap-1 mt-1" onClick={e => e.stopPropagation()}>
                    <Input 
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave(e, hist.id)
                        if (e.key === 'Escape') handleEditCancel(e)
                      }}
                      autoFocus
                      className="h-6 text-xs p-1"
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={(e) => handleEditSave(e, hist.id)}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground" onClick={handleEditCancel}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground line-clamp-1 pr-4">{hist.title}</div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-2 bg-card/90 backdrop-blur-sm rounded-md px-1">
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-primary" onClick={(e) => handleEditStart(e, hist.id, hist.title)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={(e) => handleDelete(e, hist.id)}>
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
