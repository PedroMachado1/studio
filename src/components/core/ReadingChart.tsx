
"use client"

import type React from 'react';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { LucideIcon } from 'lucide-react';

type ChartDataType = { name: string; value: number }[] | { date: string; pages: number; time: number }[];

interface ReadingChartProps {
  title: string;
  description?: string;
  data: ChartDataType;
  chartType: "bar" | "line";
  dataKeys: { name: string; color: string; icon?: LucideIcon }[]; // For line chart, multiple lines possible
  xAxisDataKey: string;
  icon?: LucideIcon;
}

export function ReadingChart({ title, description, data, chartType, dataKeys, xAxisDataKey, icon: TitleIcon }: ReadingChartProps) {
  const chartConfig = dataKeys.reduce((acc, key) => {
    acc[key.name] = { 
      label: key.name.charAt(0).toUpperCase() + key.name.slice(1), 
      color: `hsl(var(--${key.color}))`, 
      icon: key.icon 
    };
    return acc;
  }, {} as ChartConfig);
  
  const barChartMargins = { top: 5, right: 20, left: -20, bottom: 70 }; // Increased bottom margin for angled labels
  const lineChartMargins = { top: 5, right: 20, left: -20, bottom: 5 };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-2">
          {TitleIcon && <TitleIcon className="h-6 w-6 text-primary" />}
          <CardTitle className="font-headline">{title}</CardTitle>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full"> 
          {/* Increased height for bar chart to give more room */}
          {chartType === "bar" ? (
            <BarChart 
              accessibilityLayer 
              data={data as {name: string, value: number}[]} 
              margin={barChartMargins}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis 
                dataKey={xAxisDataKey} 
                tickLine={false} 
                tickMargin={10} 
                axisLine={false} 
                angle={-35} // Angle labels
                textAnchor="end" // Anchor point for angled labels
                interval={0} // Attempt to show all labels
                // height={80} // Explicit height for XAxis tick area if needed
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={10} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" hideLabel />}
              />
              <Bar dataKey={dataKeys[0].name} fill={`var(--color-${dataKeys[0].name})`} radius={4} />
               <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          ) : (
            <LineChart 
              accessibilityLayer 
              data={data as {date: string, pages: number, time: number}[]} 
              margin={lineChartMargins}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey={xAxisDataKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                // For line charts, typically don't need angled labels unless dates are very long or numerous
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              {dataKeys.map(key => (
                <Line
                  key={key.name}
                  dataKey={key.name}
                  type="monotone"
                  stroke={`var(--color-${key.name})`}
                  strokeWidth={2}
                  dot={true}
                />
              ))}
              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
