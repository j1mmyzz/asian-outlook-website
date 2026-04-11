"use client";

import { useEffect, useMemo, useRef, useState, forwardRef } from "react";
import HTMLFlipBook from "react-pageflip";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const DESKTOP_MAX_PAGE_WIDTH = 550;
const MOBILE_MAX_PAGE_WIDTH = 300;

type DocumentLoadSuccess = Parameters<
  NonNullable<React.ComponentProps<typeof Document>["onLoadSuccess"]>
>[0];

const FlipPage = forwardRef<
  HTMLDivElement,
  {
    pageNumber: number;
    width: number;
  }
>(function FlipPage({ pageNumber, width }, ref) {
  return (
    <div
      ref={ref}
      className="flex h-full w-full items-start justify-center overflow-hidden bg-white"
      style={{ touchAction: "pinch-zoom" }}
    >
      <Page
        pageNumber={pageNumber}
        width={width}
        renderTextLayer={false}
        renderAnnotationLayer={false}
      />
    </div>
  );
});

export default function MagazineFlipbook({ pdfUrl }: { pdfUrl: string }) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(11 / 8.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfNativeWidth, setPdfNativeWidth] = useState(8.5);
  const [pdfNativeHeight, setPdfNativeHeight] = useState(11);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);

  const flipBookRef = useRef<any>(null);
  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const zoomSurfaceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    function handleResize() {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsMobile(window.innerWidth < 900);
        setViewportSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 150);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    function handleFullscreenChange() {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      if (!active) {
        setZoom(1);
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const normalPageWidth = isMobile
    ? MOBILE_MAX_PAGE_WIDTH
    : DESKTOP_MAX_PAGE_WIDTH;

  function getFullscreenPageSize() {
    const viewportWidth = viewportSize.width || window.innerWidth;
    const viewportHeight = viewportSize.height || window.innerHeight;

    const horizontalPadding = isMobile ? 24 : 80;
    const verticalPadding = 140;

    const availableWidth = Math.max(200, viewportWidth - horizontalPadding);
    const availableHeight = Math.max(200, viewportHeight - verticalPadding);

    if (isMobile) {
      const pageWidthFromHeight =
        availableHeight * (pdfNativeWidth / pdfNativeHeight);
      const finalWidth = Math.min(availableWidth, pageWidthFromHeight);
      const finalHeight = finalWidth * (pdfNativeHeight / pdfNativeWidth);

      return {
        width: Math.floor(finalWidth),
        height: Math.floor(finalHeight),
      };
    }

    const spreadWidthFromHeight =
      availableHeight * ((pdfNativeWidth * 2) / pdfNativeHeight);
    const finalSpreadWidth = Math.min(availableWidth, spreadWidthFromHeight);
    const finalSinglePageWidth = finalSpreadWidth / 2;
    const finalHeight =
      finalSinglePageWidth * (pdfNativeHeight / pdfNativeWidth);

    return {
      width: Math.floor(finalSinglePageWidth),
      height: Math.floor(finalHeight),
    };
  }

  const fullscreenSize = getFullscreenPageSize();

  const pageWidth = isFullscreen ? fullscreenSize.width : normalPageWidth;
  const pageHeight = isFullscreen
    ? fullscreenSize.height
    : Math.round(pageWidth * aspectRatio);

  const pages = useMemo(
    () =>
      Array.from({ length: numPages }, (_, index) => (
        <FlipPage key={index + 1} pageNumber={index + 1} width={pageWidth} />
      )),
    [numPages, pageWidth],
  );

  function goNext() {
    flipBookRef.current?.pageFlip()?.flipNext();
  }

  function goPrev() {
    flipBookRef.current?.pageFlip()?.flipPrev();
  }

  function handleFlip(e: any) {
    setCurrentPage(e.data);
  }

  async function handleLoadSuccess(pdf: DocumentLoadSuccess) {
    setNumPages(pdf.numPages);

    try {
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1 });

      if (viewport.width > 0 && viewport.height > 0) {
        setAspectRatio(viewport.height / viewport.width);
        setPdfNativeWidth(viewport.width);
        setPdfNativeHeight(viewport.height);
      }
    } catch {}
  }

  async function toggleFullscreen() {
    if (!fullscreenRef.current) return;

    if (!document.fullscreenElement) {
      await fullscreenRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();

      const typingIntoField =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable;

      if (typingIntoField) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }

      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        toggleFullscreen();
      }

      if (isFullscreen && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)));
      }

      if (isFullscreen && event.key === "-") {
        event.preventDefault();
        setZoom((z) => Math.max(0.75, +(z - 0.1).toFixed(2)));
      }

      if (event.key === "Escape" && document.fullscreenElement) {
        event.preventDefault();
        document.exitFullscreen();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    const element = zoomSurfaceRef.current;
    if (!element) return;

    function handleWheel(event: WheelEvent) {
      if (!isFullscreen) return;
      if (!(event.ctrlKey || event.metaKey)) return;

      event.preventDefault();

      const direction = event.deltaY > 0 ? -0.1 : 0.1;
      setZoom((z) => {
        const next = +(z + direction).toFixed(2);
        return Math.min(2.5, Math.max(0.75, next));
      });
    }

    element.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      element.removeEventListener("wheel", handleWheel);
    };
  }, [isFullscreen]);

  return (
    <div
      ref={fullscreenRef}
      className={`relative w-full py-8 ${
        isFullscreen
          ? "flex min-h-screen flex-col justify-center bg-slate-100 text-white"
          : ""
      }`}
    >
      <div className="relative z-20 mb-6 flex flex-wrap items-center justify-center gap-3 px-4">
        <button
          onClick={goPrev}
          className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
          type="button"
        >
          ← Prev
        </button>

        <div
          className={`rounded-full border px-4 py-2 text-sm ${
            isFullscreen
              ? "rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition"
              : "border-neutral-200 bg-white text-neutral-700"
          }`}
        >
          Page {Math.min(currentPage + 1, Math.max(numPages, 1))} of{" "}
          {numPages || 1}
        </div>

        <button
          onClick={goNext}
          className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
          type="button"
        >
          Next →
        </button>

        <button
          onClick={toggleFullscreen}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            isFullscreen
              ? "rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
              : "border border-neutral-300 bg-white text-neutral-900 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
          }`}
          type="button"
        >
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
      </div>

      <div
        ref={zoomSurfaceRef}
        className="relative z-10 flex w-full justify-center overflow-x-auto px-4"
        style={{
          touchAction: isFullscreen ? "pinch-zoom pan-x pan-y" : "auto",
        }}
      >
        <div
          style={{
            transform: isFullscreen ? `scale(${zoom})` : "scale(1)",
            transformOrigin: "center top",
            transition: "transform 120ms ease-out",
          }}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={handleLoadSuccess}
            loading={
              <div className="rounded-xl bg-white px-6 py-4 text-sm text-neutral-600 shadow-sm">
                Loading PDF...
              </div>
            }
            error={
              <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
                Failed to load PDF
              </div>
            }
          >
            {numPages > 0 && (
              <HTMLFlipBook
                key={`${pageWidth}-${pageHeight}-${isMobile}-${isFullscreen}`}
                ref={flipBookRef}
                width={pageWidth}
                height={pageHeight}
                minWidth={pageWidth}
                maxWidth={pageWidth}
                minHeight={pageHeight}
                maxHeight={pageHeight}
                size="fixed"
                maxShadowOpacity={0.5}
                showCover={true}
                mobileScrollSupport={true}
                drawShadow={true}
                flippingTime={700}
                usePortrait={isMobile}
                startZIndex={0}
                autoSize={false}
                clickEventForward={true}
                useMouseEvents={true}
                swipeDistance={30}
                showPageCorners={!isMobile}
                disableFlipByClick={false}
                className="shadow-xl"
                style={{}}
                startPage={0}
                onFlip={handleFlip}
              >
                {pages}
              </HTMLFlipBook>
            )}
          </Document>
        </div>
      </div>
    </div>
  );
}
