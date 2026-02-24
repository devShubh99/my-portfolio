"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";

interface CandleData {
    time: string | number;
    open: number;
    high: number;
    low: number;
    close: number;
}

interface LineData {
    time: string | number;
    value: number;
}

interface CandlestickChartProps {
    candles: CandleData[];
    sma50?: LineData[];
    sma200?: LineData[];
    height?: number;
}

export default function CandlestickChart({
    candles,
    sma50 = [],
    sma200 = [],
    height = 450,
}: CandlestickChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartContainerRef.current || candles.length === 0) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "rgba(255, 255, 255, 0.6)",
                fontSize: 12,
            },
            grid: {
                vertLines: { color: "rgba(255, 255, 255, 0.04)" },
                horzLines: { color: "rgba(255, 255, 255, 0.04)" },
            },
            crosshair: {
                vertLine: {
                    color: "rgba(255, 255, 255, 0.15)",
                    labelBackgroundColor: "#020817",
                },
                horzLine: {
                    color: "rgba(255, 255, 255, 0.15)",
                    labelBackgroundColor: "#020817",
                },
            },
            rightPriceScale: {
                borderColor: "rgba(255, 255, 255, 0.08)",
            },
            timeScale: {
                borderColor: "rgba(255, 255, 255, 0.08)",
                timeVisible: true,
            },
            width: chartContainerRef.current.clientWidth,
            height,
        });

        // Candlestick series (v4 API)
        const candleSeries = chart.addCandlestickSeries({
            upColor: "#22c55e",
            downColor: "#ef4444",
            borderDownColor: "#ef4444",
            borderUpColor: "#22c55e",
            wickDownColor: "#ef4444",
            wickUpColor: "#22c55e",
        });
        candleSeries.setData(candles as any);

        // 50 SMA overlay
        if (sma50.length > 0) {
            const sma50Series = chart.addLineSeries({
                color: "#3b82f6",
                lineWidth: 2,
                title: "SMA 50",
            });
            sma50Series.setData(sma50 as any);
        }

        // 200 SMA overlay
        if (sma200.length > 0) {
            const sma200Series = chart.addLineSeries({
                color: "#f59e0b",
                lineWidth: 2,
                title: "SMA 200",
            });
            sma200Series.setData(sma200 as any);
        }

        chart.timeScale().fitContent();

        // Responsive resize
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                });
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
        };
    }, [candles, sma50, sma200, height]);

    return (
        <div
            ref={chartContainerRef}
            className="w-full rounded-lg"
            style={{ height }}
        />
    );
}
