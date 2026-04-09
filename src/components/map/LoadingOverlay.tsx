"use client";

import Image from "next/image";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Card } from "@codegouvfr/react-dsfr/Card";

import { withBasePath } from "@/lib/base-path";
import type { LoadState } from "@/types/irve-runtime";

export interface LoadingOverlayProps {
  loadState: LoadState;
}

export function LoadingOverlay({ loadState }: LoadingOverlayProps) {
  if (loadState.status === "done") return null;

  const pct =
    loadState.total > 0
      ? Math.round((loadState.loaded / loadState.total) * 100)
      : null;

  return (
    <div className="irve-loading-overlay">
      {loadState.status === "error" ? (
        <Alert
          severity="error"
          small
          title="Erreur de chargement"
          description={loadState.error || "Une erreur est survenue pendant le chargement des bornes."}
        />
      ) : (
        <Card
          title="Chargement des bornes"
          titleAs="h3"
          size="small"
          border
          desc={
            <div className="irve-loading-overlay__content">
              <Image
                className="irve-loading-overlay__image"
                src={withBasePath("/images/loading.gif")}
                alt=""
                aria-hidden="true"
                unoptimized
                width={56}
                height={56}
              />
              <p className="irve-loading-overlay__message">
                {loadState.message || "Chargement des bornes IRVE…"}
              </p>
              <div className="irve-loading-overlay__meta">
                {loadState.loaded > 0 ? (
                  <Badge severity="info">
                    {loadState.loaded} stations chargées
                  </Badge>
                ) : null}
                {pct !== null ? <Badge severity="new">{pct}%</Badge> : null}
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
