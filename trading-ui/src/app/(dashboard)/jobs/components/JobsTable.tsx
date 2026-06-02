import React from "react"
import { 
  BrainCircuit, TerminalSquare, Pause, Play, Edit, Trash2 
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TradingJob } from "./types"

interface JobsTableProps {
  jobs: TradingJob[]
  onViewLogs: (job: TradingJob) => void
  onToggleStatus: (id: string) => void
  onEdit: (job: TradingJob) => void
  onDelete: (id: string) => void
}

export const JobsTable: React.FC<JobsTableProps> = ({
  jobs,
  onViewLogs,
  onToggleStatus,
  onEdit,
  onDelete
}) => {
  const { t } = useLanguage()

  return (
    <div className="rounded-md border border-border/40 bg-card/40 backdrop-blur-sm flex-1 flex flex-col">
      <div className="overflow-x-auto flex-1">
        <Table>
          <TableHeader className="bg-muted/50 whitespace-nowrap">
            <TableRow>
              <TableHead className="w-[120px]">{t("jobs.tableTicker")}</TableHead>
              <TableHead>{t("research.settings")}</TableHead>
              <TableHead>{t("jobs.tableStatus")}</TableHead>
              <TableHead>{t("jobs.tableSchedule")}</TableHead>
              <TableHead>{t("jobs.tableHistory")}</TableHead>
              <TableHead className="text-right">{t("jobs.tableActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No scheduled jobs found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id} className="hover:bg-muted/30 group whitespace-nowrap">
                  <TableCell className="font-semibold text-foreground flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                    {job.ticker}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        {t("research.depth")}: <span className="text-foreground">{job.depth}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Agents: <span className="text-foreground">{job.agents.length}</span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={job.status === "active" ? "default" : "secondary"} 
                      className={job.status === "active" ? "bg-primary/20 text-primary border-primary/30" : ""}
                    >
                      {job.status === "active" ? (t("jobs.activeJobs").split(" ")[0]) : "Paused"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">{job.frequency}</span>
                      <span className="text-xs text-muted-foreground">
                        {t("jobs.tableNextRun")}: {job.nextRun}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {job.history.map((status, i) => (
                        <div 
                          key={i} 
                          className={`w-3 h-3 rounded-sm border border-black/20 dark:border-white/10 ${
                            status === "success" ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.4)]" :
                            status === "warning" ? "bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.4)]" :
                            status === "failed" ? "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.4)]" :
                            "bg-muted/50"
                          }`}
                          title={status}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-2 text-xs border-primary/20 hover:border-primary/50 text-muted-foreground hover:text-primary mr-2"
                        onClick={() => onViewLogs(job)}
                      >
                        <TerminalSquare className="h-3.5 w-3.5 mr-1" /> {t("jobs.viewLogs")}
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => onToggleStatus(job.id)}
                        title={job.status === "active" ? "Pause Job" : "Resume Job"}
                      >
                        {job.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => onEdit(job)}
                        title="Edit Job"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(job.id)}
                        title="Delete Job"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
