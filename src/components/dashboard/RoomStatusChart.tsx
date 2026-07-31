"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface RoomStatusChartProps {
  available: number;
  occupied: number;
  cleaning: number;
  maintenance: number;
}

const RoomStatusChart: React.FC<RoomStatusChartProps> = ({
  available,
  occupied,
  cleaning,
  maintenance,
}) => {
  const series = [available, occupied, cleaning, maintenance];
  const total = series.reduce((sum, n) => sum + n, 0);

  const options: ApexOptions = {
    colors: ["#12b76a", "#465fff", "#f79009", "#f04438"],
    labels: ["Available", "Occupied", "Cleaning", "Maintenance"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      height: 280,
    },
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: "bottom",
      horizontalAlign: "center",
      fontFamily: "Outfit",
      markers: { size: 6 },
      itemMargin: { horizontal: 10, vertical: 4 },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: {
              show: true,
              fontFamily: "Outfit",
              fontSize: "13px",
              color: "#667085",
            },
            value: {
              show: true,
              fontFamily: "Outfit",
              fontSize: "26px",
              fontWeight: 700,
              formatter: (val: string) => `${val}`,
            },
            total: {
              show: true,
              label: "Total rooms",
              formatter: () => `${total}`,
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) =>
          `${val} room${val === 1 ? "" : "s"}`,
      },
    },
  };

  if (total === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        No rooms yet.
      </div>
    );
  }

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="donut"
      height={280}
    />
  );
};

export default RoomStatusChart;
