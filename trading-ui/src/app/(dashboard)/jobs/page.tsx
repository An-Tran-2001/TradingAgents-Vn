"use client"

import React, { useState } from "react"
import { CalendarClock, Plus } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"

import { JobsMetrics } from "./components/JobsMetrics"
import { JobsTable } from "./components/JobsTable"
import { JobFormSheet } from "./components/JobFormSheet"
import { JobLogDialog } from "./components/JobLogDialog"
import { TradingJob } from "./components/types"

const initialJobs: TradingJob[] = [
  {
    id: "job-1",
    ticker: "BTC-USD",
    frequency: "Daily (00:00 UTC)",
    depth: "Deep",
    reasoning: "High",
    agents: ["Market Analyst", "Bull Researcher", "Bear Researcher", "Research Manager", "Trader"],
    startDate: "2026-06-01",
    endDate: "",
    status: "active",
    lastRun: "2 hours ago",
    nextRun: "in 22 hours",
    history: ["success", "success", "warning", "success", "success", "success", "success"]
  },
  {
    id: "job-2",
    ticker: "AAPL",
    frequency: "Weekly (Mon 09:30 EST)",
    depth: "Medium",
    reasoning: "Medium",
    agents: ["Market Analyst"],
    startDate: "2026-05-15",
    endDate: "2026-12-31",
    status: "paused",
    lastRun: "3 days ago",
    nextRun: "-",
    history: ["success", "success", "failed", "success", "success", "none", "none"]
  },
  {
    id: "job-3",
    ticker: "ETH-USD",
    frequency: "Every 4 Hours",
    depth: "Shallow",
    reasoning: "Low",
    agents: ["Market Analyst", "Trader"],
    startDate: "2026-06-01",
    endDate: "",
    status: "active",
    lastRun: "10 mins ago",
    nextRun: "in 3h 50m",
    history: ["warning", "success", "success", "success", "success", "success", "success"]
  }
]

export default function JobsPage() {
  const { t } = useLanguage()
  const [jobs, setJobs] = useState<TradingJob[]>(initialJobs)
  
  // Create / Edit Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<TradingJob | null>(null)
  
  // Log Viewer State
  const [isLogOpen, setIsLogOpen] = useState(false)
  const [selectedLogJob, setSelectedLogJob] = useState<TradingJob | null>(null)

  const openCreateSheet = () => {
    setEditingJob(null)
    setIsSheetOpen(true)
  }

  const openEditSheet = (job: TradingJob) => {
    setEditingJob(job)
    setIsSheetOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this scheduled job?")) {
      setJobs(jobs.filter(j => j.id !== id))
    }
  }

  const handleToggleStatus = (id: string) => {
    setJobs(jobs.map(j => {
      if (j.id === id) {
        return {
          ...j,
          status: j.status === "active" ? "paused" : "active",
          nextRun: j.status === "active" ? "-" : "Pending schedule"
        }
      }
      return j
    }))
  }

  const handleSave = (formData: {
    ticker: string
    frequency: string
    depth: string
    reasoning: string
    startDate: string
    endDate: string
    agents: string[]
  }) => {
    if (editingJob) {
      setJobs(jobs.map(j => j.id === editingJob.id ? {
        ...j,
        ...formData
      } : j))
    } else {
      const newJob: TradingJob = {
        id: `job-${Date.now()}`,
        ...formData,
        status: "active",
        lastRun: "Never",
        nextRun: "Pending schedule",
        history: ["none", "none", "none", "none", "none", "none", "none"]
      }
      setJobs([...jobs, newJob])
    }
    
    setIsSheetOpen(false)
  }

  const viewLogs = (job: TradingJob) => {
    setSelectedLogJob(job)
    setIsLogOpen(true)
  }

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-1.5rem)] w-full flex-col overflow-hidden rounded-xl border border-border/50 bg-background/50 relative z-0">
      <div className="cyber-grid pointer-events-none"></div>
      
      <div className="flex flex-1 flex-col overflow-y-auto relative z-10 p-4 lg:p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CalendarClock className="h-6 w-6 text-primary" />
              {t("jobs.title")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("jobs.subtitle")}
            </p>
          </div>
          <Button 
            onClick={openCreateSheet} 
            className="gap-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            <Plus className="h-4 w-4" />
            {t("jobs.create")}
          </Button>
        </div>

        {/* Top Metrics & Chart Grid */}
        <JobsMetrics jobs={jobs} />

        {/* Data Table */}
        <JobsTable 
          jobs={jobs}
          onViewLogs={viewLogs}
          onToggleStatus={handleToggleStatus}
          onEdit={openEditSheet}
          onDelete={handleDelete}
        />
      </div>

      {/* Create / Edit Sheet */}
      <JobFormSheet 
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        editingJob={editingJob}
        onSave={handleSave}
      />

      {/* CLI-STYLE HOLOGRAPHIC LOG VIEWER DIALOG */}
      <JobLogDialog 
        isOpen={isLogOpen}
        onOpenChange={setIsLogOpen}
        selectedJob={selectedLogJob}
      />
    </div>
  )
}
