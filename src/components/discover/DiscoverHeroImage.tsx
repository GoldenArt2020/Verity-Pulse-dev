"use client";

import { useMediaImage } from "@/hooks/useMediaImage";

export function DiscoverHeroImage() {
  const { url: heroImage } = useMediaImage("detective evidence board dark room investigation");

  return (
    <div className="relative h-52 w-full overflow-hidden rounded-2xl bg-[#111114]">
      {heroImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={heroImage} alt="" className="h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
    </div>
  );
}