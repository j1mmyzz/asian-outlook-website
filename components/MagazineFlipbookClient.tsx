"use client";

import dynamic from "next/dynamic";

const MagazineFlipbook = dynamic(
  () => import("@/components/MagazineFlipbook"),
  {
    ssr: false,
    loading: () => <div className="py-10 text-center">Loading magazine...</div>,
  },
);

export default function MagazineFlipbookClient({ pdfUrl }: { pdfUrl: string }) {
  return <MagazineFlipbook pdfUrl={pdfUrl} />;
}
