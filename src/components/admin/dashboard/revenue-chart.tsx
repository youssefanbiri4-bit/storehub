"use client";

interface RevenueChartProps {
  data: Array<{ date: string; revenue: number }>;
  currency?: string;
}

export function RevenueChart({ data, currency = "MAD" }: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const chartHeight = 160;
  const chartWidth = 600;
  const padding = { top: 10, right: 10, bottom: 30, left: 10 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1 || 1)) * innerWidth,
    y: padding.top + innerHeight - (d.revenue / maxRevenue) * innerHeight,
    date: d.date,
    revenue: d.revenue,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${padding.top + innerHeight} L ${points[0]?.x ?? 0} ${padding.top + innerHeight} Z`;

  const formatAmount = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toLocaleString();
  };

  const formatLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Show every 5th label
  const labelIndices = data.reduce((acc: number[], _, i) => {
    if (i % 5 === 0 || i === data.length - 1) acc.push(i);
    return acc;
  }, []);

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className="text-2xl font-bold">{currency} {formatAmount(totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </div>
      </div>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-40">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.15} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            y1={padding.top + innerHeight * (1 - ratio)}
            x2={padding.left + innerWidth}
            y2={padding.top + innerHeight * (1 - ratio)}
            stroke="var(--border)"
            strokeDasharray="3 3"
            strokeWidth={0.5}
          />
        ))}
        {/* Area */}
        <path d={areaPath} fill="url(#areaGradient)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {/* X-axis labels */}
        {labelIndices.map((i) => (
          <text
            key={i}
            x={points[i].x}
            y={chartHeight - 5}
            textAnchor="middle"
            fill="var(--muted-foreground)"
            fontSize={10}
          >
            {formatLabel(data[i].date)}
          </text>
        ))}
      </svg>
    </div>
  );
}
