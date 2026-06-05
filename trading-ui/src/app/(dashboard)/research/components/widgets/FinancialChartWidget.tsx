import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface FinancialChartWidgetProps {
  data: {
    ticker: string;
    metric: string;
    period: string;
  };
}

// Generate realistic mock financial data
function generateMockFinancials(metric: string, period: string) {
  const isQuarterly = period.includes('Q');
  const count = parseInt(period) || 5;
  const data = [];
  
  let baseValue = metric.toLowerCase().includes('revenue') ? 10000 : 
                  metric.toLowerCase().includes('profit') ? 2000 : 
                  metric.toLowerCase().includes('pe') ? 15 : 100;
                  
  let currentDate = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const label = isQuarterly ? 
      `Q${Math.floor(currentDate.getMonth()/3) + 1} ${currentDate.getFullYear()}` : 
      `${currentDate.getFullYear()}`;
      
    // Add some random growth/decline
    const change = baseValue * (Math.random() * 0.4 - 0.15); // -15% to +25%
    baseValue += change;
    
    // Ensure P/E doesn't go below 5
    if (metric.toLowerCase().includes('pe') && baseValue < 5) baseValue = 5 + Math.random() * 5;
    
    data.push({
      name: label,
      value: Math.round(baseValue),
    });
    
    if (isQuarterly) {
      currentDate.setMonth(currentDate.getMonth() - 3);
    } else {
      currentDate.setFullYear(currentDate.getFullYear() - 1);
    }
  }
  
  return data.reverse();
}

export const FinancialChartWidget: React.FC<FinancialChartWidgetProps> = ({ data }) => {
  const chartData = generateMockFinancials(data.metric, data.period);
  
  // Format numbers nicely
  const formatYAxis = (tickItem: any) => {
    if (tickItem >= 1000) return `${(tickItem / 1000).toFixed(1)}k`;
    return tickItem;
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border/50 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-foreground font-semibold mb-1">{label}</p>
          <p className="text-blue-400 font-mono">
            {data.metric}: {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="my-4 rounded-xl border border-primary/20 bg-background/50 p-4 shadow-sm w-full">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-5 w-5 text-blue-500" />
        <h4 className="font-semibold text-foreground">Financial Data</h4>
      </div>
      <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-4">
        <div className="flex flex-wrap gap-4">
          <div><span className="font-medium text-foreground">Ticker:</span> <span className="font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{data.ticker}</span></div>
          <div><span className="font-medium text-foreground">Metric:</span> <span className="capitalize">{data.metric}</span></div>
          <div><span className="font-medium text-foreground">Period:</span> {data.period}</div>
        </div>
      </div>
      <div className="mt-2 w-full h-[300px] rounded-lg border border-border/50 bg-black/20 p-4 relative">
        <div className="absolute top-2 left-2 z-10 opacity-50 pointer-events-none">
           <span className="text-[10px] font-mono text-blue-500">MOCK DATA</span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.value > chartData[0].value ? '#3b82f6' : '#60a5fa'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
