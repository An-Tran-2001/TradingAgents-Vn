import { fetchClient } from "@/lib/api/client"
import { TradingJob } from "./components/types"

export async function fetchJobs(): Promise<TradingJob[]> {
  const data = await fetchClient("/jobs")
  
  // Transform API data to TradingJob type if needed
  return data.map((job: any) => ({
    id: job.id.toString(),
    ticker: job.ticker,
    frequency: job.frequency,
    depth: job.depth,
    reasoning: job.reasoning_effort,
    agents: job.agents,
    startDate: job.start_date,
    endDate: job.end_date || "",
    status: job.status,
    lastRun: job.last_run,
    nextRun: job.next_run,
    history: job.history,
    config: job.config
  }))
}

export async function fetchJobMetrics(): Promise<any> {
  const data = await fetchClient("/jobs/metrics")
  return data
}

export async function fetchJobLogs(jobId: string): Promise<any[]> {
  const data = await fetchClient(`/jobs/${jobId}/logs`)
  return data
}

export async function createJob(data: any): Promise<TradingJob> {
  const payload = {
    ticker: data.ticker,
    frequency: data.frequency,
    depth: data.depth,
    reasoning_effort: data.reasoning,
    agents: data.agents,
    start_date: data.startDate,
    end_date: data.endDate || null,
    config: data.config,
  }

  const job = await fetchClient("/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return {
    id: job.id.toString(),
    ticker: job.ticker,
    frequency: job.frequency,
    depth: job.depth,
    reasoning: job.reasoning_effort,
    agents: job.agents,
    startDate: job.start_date,
    endDate: job.end_date || "",
    status: job.status,
    lastRun: job.last_run,
    nextRun: job.next_run,
    history: job.history,
    config: job.config
  }
}

export async function updateJob(id: string, data: any): Promise<TradingJob> {
  const payload = {
    ticker: data.ticker,
    frequency: data.frequency,
    depth: data.depth,
    reasoning_effort: data.reasoning,
    agents: data.agents,
    end_date: data.endDate || null,
    status: data.status,
    config: data.config,
  }

  const job = await fetchClient(`/jobs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })

  return {
    id: job.id.toString(),
    ticker: job.ticker,
    frequency: job.frequency,
    depth: job.depth,
    reasoning: job.reasoning_effort,
    agents: job.agents,
    startDate: job.start_date,
    endDate: job.end_date || "",
    status: job.status,
    lastRun: job.last_run,
    nextRun: job.next_run,
    history: job.history,
    config: job.config
  }
}

export async function deleteJob(id: string): Promise<void> {
  await fetchClient(`/jobs/${id}`, {
    method: "DELETE",
  })
}
