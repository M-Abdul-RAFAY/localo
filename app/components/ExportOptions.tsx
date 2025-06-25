"use client";

import React from "react";
import { RankingData } from "@/types";

interface ExportOptionsProps {
  data: RankingData;
  onExport: (format: string) => void;
}

interface ExportFormat {
  value: string;
  label: string;
  icon: string;
  description: string;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ data, onExport }) => {
  const exportFormats: ExportFormat[] = [
    {
      value: "csv",
      label: "CSV File",
      icon: "📊",
      description: "Spreadsheet format",
    },
    {
      value: "pdf",
      label: "PDF Report",
      icon: "📄",
      description: "Professional report",
    },
    {
      value: "json",
      label: "JSON Data",
      icon: "📋",
      description: "Raw data export",
    },
  ];

  const handleExport = (format: string): void => {
    if (!data) return;
    switch (format) {
      case "csv":
        exportToCSV(data);
        break;
      case "pdf":
        exportToPDF(data);
        break;
      case "json":
        exportToJSON(data);
        break;
    }
    onExport(format);
  };

  const exportToCSV = (data: RankingData): void => {
    const headers = [
      "Rank",
      "Business Name",
      "Visibility %",
      "Difficulty",
      "Rating",
      "Reviews",
      "Is Target",
    ];
    const rows = data.businesses.map((business) => [
      business.rank,
      business.name,
      business.visibility,
      business.difficulty,
      business.rating || "N/A",
      business.reviews || "N/A",
      business.isTarget ? "Yes" : "No",
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
    downloadFile(csvContent, "ranking-analysis.csv", "text/csv");
  };

  const exportToJSON = (data: RankingData): void => {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, "ranking-analysis.json", "application/json");
  };

  const exportToPDF = (data: RankingData): void => {
    alert("PDF export would be implemented with a library like jsPDF");
  };

  const downloadFile = (
    content: string,
    filename: string,
    mimeType: string
  ): void => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white text-zinc-900 rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Export Options</h2>
      <p className="text-sm text-gray-500 mb-4">
        Select the format for exporting the data:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {exportFormats.map((format) => (
          <div
            key={format.value}
            className="border rounded-lg p-4 flex flex-col items-start"
          >
            <div className="text-2xl">{format.icon}</div>
            <div className="text-sm font-medium mt-2">{format.label}</div>
            <div className="text-xs text-gray-500">{format.description}</div>
            <button
              onClick={() => handleExport(format.value)}
              className="mt-3 w-full bg-blue-600 text-white rounded-md py-2 text-[0.7rem] font-semibold hover:bg-blue-700 transition-all"
            >
              Export as {format.label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExportOptions;
