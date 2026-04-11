"use client";

type DownloadPdfButtonProps = {
  pdfUrl: string;
  fileName: string;
  className?: string;
};

export default function DownloadPdfButton({
  pdfUrl,
  fileName,
  className,
}: DownloadPdfButtonProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch PDF");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button type="button" onClick={handleDownload} className={className}>
      Download
    </button>
  );
}
