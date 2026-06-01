import { Activity, Cpu, FileText, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/10 *:data-[slot=card]:to-card/80 dark:*:data-[slot=card]:bg-card/40 *:data-[slot=card]:backdrop-blur-xl *:data-[slot=card]:border-primary/20 *:data-[slot=card]:hover:scale-[1.02] *:data-[slot=card]:hover:shadow-[0_0_20px_rgba(var(--primary),0.15)] *:data-[slot=card]:transition-all *:data-[slot=card]:duration-300 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2 font-medium">
            <Cpu className="h-4 w-4 text-primary" /> Active Trading Agents
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl pt-2">
            24
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Activity className="mr-1 h-3 w-3" />
              +3
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-foreground/80">
            +3 newly deployed this week
          </div>
          <div className="text-muted-foreground">
            Across 4 active strategies
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2 font-medium">
            <FileText className="h-4 w-4 text-primary" /> Reports Generated
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl pt-2">
            1,234
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Activity className="mr-1 h-3 w-3" />
              +15%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-foreground/80">
            Increased processing volume
          </div>
          <div className="text-muted-foreground">
            Analysis coverage expanding
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2 font-medium">
            <Activity className="h-4 w-4 text-primary" /> System Uptime
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl pt-2 text-green-500">
            99.98%
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              Optimal
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-foreground/80">
            Stable engine performance
          </div>
          <div className="text-muted-foreground">Zero dropped connections</div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2 font-medium">
            <Zap className="h-4 w-4 text-primary" /> API Inferences (24h)
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl pt-2">
            456K
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Activity className="mr-1 h-3 w-3" />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-foreground/80">
            Steady LLM usage volume
          </div>
          <div className="text-muted-foreground">Token consumption nominal</div>
        </CardFooter>
      </Card>
    </div>
  )
}
