"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { formatCurrency } from "@/lib/metrics";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface RevenueByTypeChartProps {
  data: Array<{ type: string; revenue: number }>;
}

const RevenueByTypeChart: React.FC<RevenueByTypeChartProps> = ({ data }) => {
  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 280,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "55%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: data.map((d) => d.type),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { formatter: (val: string) => formatCurrency(Number(val)) },
    },
    yaxis: {
      labels: {
        style: { fontFamily: "Outfit" },
      },
    },
    grid: { xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    legend: { show: false },
    tooltip: {
      y: { formatter: (val: number) => formatCurrency(val) },
    },
  };

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        No room types configured.
      </div>
    );
  }

  return (
    <ReactApexChart
      options={options}
      series={[{ name: "Revenue", data: data.map((d) => d.revenue) }]}
      type="bar"
      height={280}
    />
  );
};

export default RevenueByTypeChart;
