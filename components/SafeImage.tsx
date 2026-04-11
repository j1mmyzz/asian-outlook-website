"use client";

import { useState } from "react";

export default function SafeImage({
  src,
  alt,
  className,
  fallbackSrc = "/placeholder-magazine.jpg",
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc(fallbackSrc)}
    />
  );
}
