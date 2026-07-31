"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { formatDate, type DayMetrics } from "@/lib/metrics";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface OccupancyTrendChartProps {
  days: DayMetrics[];
}

const OccupancyTrendChart: React.FC<OccupancyTrendChartProps> = ({ days }) => {
  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 310,
      toolbar: { show: false },
    },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: {
      categories: days.map((d) => formatDate(d.date)),
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: Math.min(days.length, 12),
    },
    yaxis: {
      min: 0,
      max: 100,
      labels: { formatter: (val: number) => `${Math.round(val)}%` },
    },
    grid: { yaxis: { lines: { show: true } } },
    legend: { show: false },
    tooltip: {
      y: { formatter: (val: number) => `${val}% occupancy` },
    },
  };

  const series = [
    {
      name: "Occupancy",
      data: days.map((d) => Math.round(d.occupancyRate * 100)),
    },
  ];

  return (
    <div className="custom-scrollbar max-w-full overflow-x-auto">
      <div className="min-w-[600px]">
        <ReactApexChart
          options={options}
          series={series}
          type="area"
          height={310}
        />
      </div>
    </div>
  );
};

export default OccupancyTrendChart;
