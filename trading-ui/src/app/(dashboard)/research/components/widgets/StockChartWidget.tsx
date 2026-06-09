import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { LineChart } from 'lucide-react';

interface StockChartWidgetProps {
  data: {
    ticker: string;
    timeframe: string;
    indicators?: string[];
  };
}

// Generate realistic mock daily candle data
function generateMockCandles(days = 100, basePrice = 100) {
  const candles = [];
  let currentPrice = basePrice;
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    if (!isWeekend) {
      const volatility = currentPrice * 0.02;
      const open = currentPrice + (Math.random() - 0.5) * volatility;
      const close = open + (Math.random() - 0.5) * volatility * 2;
      const high = Math.max(open, close) + Math.random() * volatility;
      const low = Math.min(open, close) - Math.random() * volatility;
      
      candles.push({
        time: currentDate.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
      });
      currentPrice = close;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return candles;
}

export const StockChartWidget: React.FC<StockChartWidgetProps> = ({ data }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af', // muted-foreground
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      width: chartContainerRef.current.clientWidth,
      height: 350,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', // emerald-500
      downColor: '#ef4444', // red-500
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    // Base price generated somewhat randomly based on ticker string length to have varying charts
    const basePrice = (data.ticker.length * 10) + 20; 
    const mockData = generateMockCandles(120, basePrice);
    
    candlestickSeries.setData(mockData);

    // If SMA is requested
    if (data.indicators?.includes('SMA20') || data.indicators?.includes('SMA')) {
       const smaSeries = chart.addSeries(LineSeries, {
         color: '#3b82f6', // blue-500
         lineWidth: 2 as const,
         crosshairMarkerVisible: false,
       });
       
       // Calculate basic SMA 20
       const smaData = [];
       for (let i = 0; i < mockData.length; i++) {
         if (i >= 19) {
           let sum = 0;
           for (let j = 0; j < 20; j++) {
             sum += mockData[i - j].close;
           }
           smaData.push({ time: mockData[i].time, value: sum / 20 });
         }
       }
       smaSeries.setData(smaData);
    }

    chart.timeScale().fitContent();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div className="my-4 rounded-xl border border-primary/20 bg-background/50 p-4 shadow-sm w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <LineChart className="h-5 w-5 text-emerald-500" />
        <h4 className="font-semibold text-foreground">Trading Chart</h4>
      </div>
      <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-4">
        <div className="flex flex-wrap gap-4">
          <div><span className="font-medium text-foreground">Ticker:</span> <span className="font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{data.ticker}</span></div>
          <div><span className="font-medium text-foreground">Timeframe:</span> {data.timeframe}</div>
          {data.indicators && data.indicators.length > 0 && (
            <div><span className="font-medium text-foreground">Indicators:</span> {data.indicators.join(', ')}</div>
          )}
        </div>
      </div>
      <div className="mt-2 w-full rounded-lg border border-border/50 bg-black/20 overflow-hidden relative">
        <div className="absolute top-2 left-2 z-10 opacity-50 pointer-events-none">
          <span className="text-[10px] font-mono text-emerald-500">MOCK DATA - TRADINGVIEW ENGINE</span>
        </div>
        <div ref={chartContainerRef} className="w-full" />
      </div>
    </div>
  );
};
