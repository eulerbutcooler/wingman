"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: "pdf" | "docx" | "pptx";
}

export default function FileViewerModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType,
}: FileViewerModalProps) {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || fileType !== "pdf") return;

    // For PDFs, fetch as blob and create object URL
    // This works around CORS and public access issues
    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Failed to load PDF");
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(blobUrl);
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError("Failed to load PDF. Please try downloading instead.");
      } finally {
        setLoading(false);
      }
    };

    loadPdf();

    // Cleanup blob URL on unmount
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, fileUrl, fileType]);

  if (!isOpen) return null;

  // For PDF: Use blob URL (works around CORS/access issues)
  // For DOCX/PPTX: Use Microsoft Office viewer
  const viewerUrl =
    fileType === "pdf"
      ? pdfBlobUrl || fileUrl
      : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
          fileUrl
        )}`;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.3)] w-full max-w-7xl h-[90vh] flex flex-col border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 truncate">
              {fileName}
            </h2>
            <p className="text-sm text-slate-500 uppercase mt-1 font-medium">
              {fileType} Document
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors flex-shrink-0"
            aria-label="Close viewer"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Viewer */}
        <div className="flex-1 overflow-hidden bg-slate-50 flex items-center justify-center">
          {loading && fileType === "pdf" ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-600">Loading PDF...</p>
            </div>
          ) : error && fileType === "pdf" ? (
            <div className="text-center p-8">
              <p className="text-red-600 mb-4">{error}</p>
              <a
                href={fileUrl}
                download={fileName}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium inline-block shadow-sm"
              >
                Download PDF Instead
              </a>
            </div>
          ) : (
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0"
              title={`${fileName} viewer`}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          )}
        </div>

        {/* Footer with actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200">
          <a
            href={fileUrl}
            download={fileName}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Download Original
          </a>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
