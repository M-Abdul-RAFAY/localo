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
      description: "Spreadsheet format for Excel",
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
      "Address",
      "Visibility %",
      "Difficulty",
      "Rating",
      "Reviews",
      "Is Target",
      "Latitude",
      "Longitude",
    ];

    const rows = data.businesses.map((business) => [
      business.rank || "N/A",
      business.name || "Unknown",
      business.address || "N/A",
      business.visibility || "N/A",
      business.difficulty || "N/A",
      business.rating || "N/A",
      business.reviews || "N/A",
      business.isTarget ? "Yes" : "No",
      business.lat || "N/A",
      business.lng || "N/A",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    // Add metadata header
    const metadata = [
      `"Analysis Date","${new Date(data.timestamp).toLocaleDateString()}"`,
      `"Search Center","${data.center.lat}, ${data.center.lng}"`,
      `"Total Businesses","${data.businesses.length}"`,
      `""`, // Empty row
    ].join("\n");

    const fullContent = metadata + "\n" + csvContent;
    downloadFile(fullContent, "ranking-analysis.csv", "text/csv");
  };

  const exportToJSON = (data: RankingData): void => {
    const exportData = {
      ...data,
      metadata: {
        exportDate: new Date().toISOString(),
        totalBusinesses: data.businesses.length,
        targetBusiness:
          data.businesses.find((b) => b.isTarget)?.name || "Not found",
      },
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    downloadFile(jsonContent, "ranking-analysis.json", "application/json");
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

  const getExportSummary = () => {
    const targetBusiness = data.businesses.find((b) => b.isTarget);
    const competitorCount = data.businesses.filter((b) => !b.isTarget).length;

    return {
      targetRank: targetBusiness?.rank || "Not found",
      targetName: targetBusiness?.name || "Unknown",
      competitorCount,
      totalBusinesses: data.businesses.length,
    };
  };

  const summary = getExportSummary();

  return (
    <div className="bg-white text-zinc-900 rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Export Results</h2>

      {/* Export Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Analysis Summary
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Your Rank:</span>
            <span className="ml-2 font-medium">#{summary.targetRank}</span>
          </div>
          <div>
            <span className="text-gray-600">Competitors:</span>
            <span className="ml-2 font-medium">{summary.competitorCount}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-600">Business:</span>
            <span className="ml-2 font-medium">{summary.targetName}</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Export your ranking data in different formats:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {exportFormats.map((format) => (
          <div
            key={format.value}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{format.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {format.label}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {format.description}
                </div>
                <button
                  onClick={() => handleExport(format.value)}
                  className="mt-3 w-full bg-blue-600 text-white rounded-md py-2 text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  Export as {format.label}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Export Notes */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-xs font-medium text-blue-900 mb-1">
          📝 Export Notes
        </h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• CSV files can be opened in Excel or Google Sheets</li>
          <li>• JSON format preserves all data for developers</li>
          <li>• Exported data includes coordinates for mapping</li>
          <li>• Analysis timestamp is included for reference</li>
        </ul>
      </div>
    </div>
  );
};

export default ExportOptions;
