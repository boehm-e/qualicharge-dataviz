// app/carte/page.tsx
"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

const IRVEMap = dynamic(() => import("@/components/map/IRVEMap"), {
  ssr: false,
  loading: () => (
    <div className="irve-map-skeleton">
      <Image
        className="irve-map-skeleton__image"
        src="/images/loading.gif"
        alt=""
        aria-hidden="true"
        unoptimized
        width={40}
        height={40}
      />
      <p>Initialisation de la carte…</p>
    </div>
  ),
});

export default function CartePage() {
  return (
    <main className="irve-page">
      <div className="irve-map-container">
        <IRVEMap />
      </div>
    </main>
  );
}
