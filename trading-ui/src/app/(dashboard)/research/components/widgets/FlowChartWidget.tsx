import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Activity } from 'lucide-react';

interface FlowChartWidgetProps {
  data: {
    ticker: string;
    days: number;
  };
}

// Generate realistic mock flow data (Net Buy/Sell in Billions VND)
function generateMockFlows(days: number) {
  const data = [];
  let currentDate = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    if (!isWeekend) {
      // Generate a value between -100 to 100 billion VND
      const netFlow = (Math.random() * 200) - 100;
      
      data.push({
        date: currentDate.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' }),
        value: netFlow,
      });
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return data.reverse();
}

export const FlowChartWidget: React.FC<FlowChartWidgetProps> = ({ data }) => {
  const chartData = generateMockFlows(data.days);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const isPositive = val > 0;
      return (
        <div className="bg-card border border-border/50 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-foreground font-semibold mb-1">{label}</p>
          <p className={`font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? 'Mua ròng' : 'Bán ròng'}: {Math.abs(val).toFixed(1)} tỷ VNĐ
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="my-4 rounded-xl border border-primary/20 bg-background/50 p-4 shadow-sm w-full">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-5 w-5 text-purple-500" />
        <h4 className="font-semibold text-foreground">Institutional Flow (Net Buy/Sell)</h4>
      </div>
      <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-4">
        <div className="flex flex-wrap gap-4">
          <div><span className="font-medium text-foreground">Ticker:</span> <span className="font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">{data.ticker}</span></div>
          <div><span className="font-medium text-foreground">Period:</span> Last {data.days} days</div>
        </div>
      </div>
      <div className="mt-2 w-full h-[250px] rounded-lg border border-border/50 bg-black/20 p-4 relative">
        <div className="absolute top-2 left-2 z-10 opacity-50 pointer-events-none">
           <span className="text-[10px] font-mono text-purple-500">MOCK DATA</span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
