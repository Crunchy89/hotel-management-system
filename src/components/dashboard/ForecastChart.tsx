"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type { DayMetrics } from "@/lib/metrics";
import { formatDate } from "@/lib/metrics";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface ForecastChartProps {
  days: DayMetrics[];
  roomCount: number;
}

const ForecastChart: React.FC<ForecastChartProps> = ({ days, roomCount }) => {
  const options: ApexOptions = {
    colors: ["#465fff", "#12b76a"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 300,
      type: "line",
      toolbar: { show: false },
    },
    stroke: {
      width: [0, 3],
      curve: "smooth",
    },
    plotOptions: {
      bar: {
        columnWidth: "45%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: days.map((d) => formatDate(d.date)),
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: Math.min(days.length, 10),
    },
    yaxis: [
      {
        seriesName: "Rooms occupied",
        max: roomCount || undefined,
        min: 0,
        title: {
          text: "Rooms",
          style: { fontFamily: "Outfit", fontWeight: 500 },
        },
        labels: { formatter: (val: number) => `${Math.round(val)}` },
      },
      {
        seriesName: "Revenue",
        opposite: true,
        min: 0,
        title: {
          text: "Revenue",
          style: { fontFamily: "Outfit", fontWeight: 500 },
        },
        labels: { formatter: (val: number) => `$${Math.round(val)}` },
      },
    ],
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
      markers: { size: 6 },
    },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: [1, 1] },
    tooltip: {
      shared: true,
      intersect: false,
      y: [
        { formatter: (val: number) => `${val} rooms` },
        { formatter: (val: number) => `$${Math.round(val)}` },
      ],
    },
    markers: { size: 0, hover: { size: 5 } },
  };

  const series = [
    {
      name: "Rooms occupied",
      type: "column",
      data: days.map((d) => d.occupied),
    },
    {
      name: "Revenue",
      type: "line",
      data: days.map((d) => d.revenue),
    },
  ];

  return (
    <div className="custom-scrollbar max-w-full overflow-x-auto">
      <div className="min-w-[600px]">
        <ReactApexChart
          options={options}
          series={series}
          type="line"
          height={300}
        />
      </div>
    </div>
  );
};

export default ForecastChart;
