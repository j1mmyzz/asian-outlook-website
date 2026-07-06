export function DownloadPdfButton({
  pdfUrl,
  fileName,
  className,
}: {
  pdfUrl: string;
  fileName: string;
  className?: string;
}) {
  async function handleDownload() {
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("Failed to fetch PDF");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <button type="button" onClick={handleDownload} className={className}>
      Download PDF
    </button>
  );
}
