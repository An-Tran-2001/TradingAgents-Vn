import React from "react"
import { 
  Activity, Layers, AlertTriangle, CheckCircle2, CalendarClock, Clock 
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TradingJob } from "./types"

const durationChartData = [
  { name: 'Mon', duration: 120 },
  { name: 'Tue', duration: 150 },
  { name: 'Wed', duration: 180 },
  { name: 'Thu', duration: 140 },
  { name: 'Fri', duration: 210 },
  { name: 'Sat', duration: 90 },
  { name: 'Sun', duration: 110 },
]

interface JobsMetricsProps {
  jobs: TradingJob[]
}

export const JobsMetrics: React.FC<JobsMetricsProps> = ({ jobs }) => {
  const { t } = useLanguage()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      
      {/* Left: 4 Metrics Cards */}
      <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-card/40 backdrop-blur-md border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Token Usage (24h)</CardTitle>
            <Activity className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142,500</div>
            <p className="text-xs text-muted-foreground mt-1">~ $0.42 spent today</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/40 backdrop-blur-md border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("jobs.activeJobs")}</CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.filter(j => j.status === "active").length} Active</div>
            <p className="text-xs text-muted-foreground mt-1">System capacity: 85% free</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/40 backdrop-blur-md border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Warnings & Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">2 Warnings</div>
            <p className="text-xs text-muted-foreground mt-1 text-green-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3"/> 0 Critical Errors
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/40 backdrop-blur-md border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("jobs.completedJobs")}</CardTitle>
            <CalendarClock className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length} Jobs</div>
            <p className="text-xs text-muted-foreground mt-1">Across {new Set(jobs.map(j => j.ticker)).size} different tickers</p>
          </CardContent>
        </Card>
      </div>

      {/* Right: Duration Chart */}
      <div className="col-span-1">
        <Card className="bg-card/40 backdrop-blur-md border-primary/20 h-full flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> {t("jobs.runDuration")} (7D)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-4 px-2 min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}m`} width={35} />
                <Tooltip 
                  cursor={{fill: 'rgba(0,240,255,0.05)'}} 
                  contentStyle={{backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '8px'}} 
                />
                <Bar dataKey="duration" fill="#00f0ff" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
    </div>
  )
}
