import { useEffect, useRef, useState } from "react";

export function SafeImage({
  src,
  alt,
  className,
  fallbackSrc = "/magazine_image.jpg",
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imgSrc, setImgSrc] = useState(src);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setImgSrc(src);
  }, [src]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const image = imageRef.current;
      if (image?.complete && image.naturalWidth > 0) {
        setLoaded(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [imgSrc]);

  return (
    <img
      ref={imageRef}
      key={imgSrc}
      src={imgSrc}
      alt={alt}
      className={`${className || ""} ${loaded ? "opacity-100" : "opacity-0"}`}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      onError={() => {
        if (imgSrc !== fallbackSrc) {
          setLoaded(false);
          setImgSrc(fallbackSrc);
        } else {
          setLoaded(true);
        }
      }}
    />
  );
}
