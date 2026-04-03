// app/carte/page.tsx
"use client";

import dynamic from "next/dynamic";

const IRVEMap = dynamic(() => import("@/components/map/IRVEMap"), {
  ssr: false,
  loading: () => (
    <div className="irve-map-skeleton">
      <div className="irve-map-skeleton__spinner" />
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
