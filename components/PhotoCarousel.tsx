"use client";

import { useState } from "react";
import Image from "next/image";

export default function PhotoCarousel({
  photos,
  shopName,
  color,
  category,
}: {
  photos: string[];
  shopName: string;
  color: string;
  category: string;
}) {
  const [index, setIndex] = useState(0);
  const hasPhotos = photos.length > 0;
  const go = (delta: number) => setIndex((i) => (i + delta + photos.length) % photos.length);

  return (
    <div className={`store-gallery ${color}`}>
      {hasPhotos ? (
        <div className="gallery-main photo">
          <Image
            key={photos[index]}
            src={photos[index]}
            alt={`Storefront of ${shopName}`}
            fill
            sizes="100vw"
            priority={index === 0}
            className="gallery-photo"
          />
          {photos.length > 1 ? (
            <>
              <button type="button" className="gallery-nav prev" onClick={() => go(-1)} aria-label="Previous photo">‹</button>
              <button type="button" className="gallery-nav next" onClick={() => go(1)} aria-label="Next photo">›</button>
              <div className="gallery-dots">
                {photos.map((photo, i) => (
                  <button
                    key={photo}
                    type="button"
                    className={i === index ? "gallery-dot active" : "gallery-dot"}
                    onClick={() => setIndex(i)}
                    aria-label={`Show photo ${i + 1} of ${photos.length}`}
                  />
                ))}
              </div>
            </>
          ) : (
            <span className="gallery-caption">Storefront photo</span>
          )}
        </div>
      ) : (
        <div className="gallery-main gallery-fallback">
          <span className="gallery-shape shape-one" />
          <span className="gallery-shape shape-two" />
          <strong>{category}</strong>
          <small>No photo uploaded yet</small>
        </div>
      )}
    </div>
  );
}
