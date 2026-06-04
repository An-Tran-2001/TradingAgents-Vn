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

import { fetchJobs, fetchJobMetrics, createJob, updateJob, deleteJob } from "./api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function JobsPage() {
  const { t } = useLanguage()
  const [jobs, setJobs] = useState<TradingJob[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
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

  React.useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setIsLoading(true)
      const [jobsData, metricsData] = await Promise.all([
        fetchJobs(),
        fetchJobMetrics()
      ])
      setJobs(jobsData)
      setMetrics(metricsData)
    } catch (error) {
      console.error("Failed to load jobs", error)
      toast.error(t("common.error") || "Failed to load scheduled jobs")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this scheduled job?")) {
      try {
        await deleteJob(id)
        toast.success("Job deleted successfully")
        setJobs(jobs.filter(j => j.id !== id))
        const metricsData = await fetchJobMetrics()
        setMetrics(metricsData)
      } catch (error) {
        console.error("Failed to delete job", error)
        toast.error("Failed to delete job")
      }
    }
  }

  const handleToggleStatus = async (id: string) => {
    const job = jobs.find(j => j.id === id)
    if (!job) return
    const newStatus = job.status === "active" ? "paused" : "active"
    try {
      const updatedJob = await updateJob(id, { ...job, status: newStatus })
      setJobs(jobs.map(j => (j.id === id ? updatedJob : j)))
      toast.success(`Job ${newStatus === "active" ? "resumed" : "paused"}`)
      const metricsData = await fetchJobMetrics()
      setMetrics(metricsData)
    } catch (error) {
      console.error("Failed to update status", error)
      toast.error("Failed to change job status")
    }
  }

  const handleSave = async (formData: {
    ticker: string
    frequency: string
    depth: string
    reasoning: string
    startDate: string
    endDate: string
    agents: string[]
  }) => {
    try {
      if (editingJob) {
        const updatedJob = await updateJob(editingJob.id, { ...editingJob, ...formData })
        setJobs(jobs.map(j => j.id === editingJob.id ? updatedJob : j))
        toast.success("Job updated successfully")
        const metricsData = await fetchJobMetrics()
        setMetrics(metricsData)
      } else {
        const newJob = await createJob(formData)
        setJobs([newJob, ...jobs])
        const metricsData = await fetchJobMetrics()
        setMetrics(metricsData)
        toast.success("Job scheduled successfully")
      }
      setIsSheetOpen(false)
    } catch (error) {
      console.error("Failed to save job", error)
      toast.error("Failed to save scheduled job")
    }
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
        <JobsMetrics jobs={jobs} metrics={metrics} />

        {/* Data Table */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          </div>
        ) : (
          <JobsTable 
            jobs={jobs}
            onViewLogs={viewLogs}
            onToggleStatus={handleToggleStatus}
            onEdit={openEditSheet}
            onDelete={handleDelete}
          />
        )}
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
