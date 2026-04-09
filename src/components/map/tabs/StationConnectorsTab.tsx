import Image from "next/image";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { Tag } from "@codegouvfr/react-dsfr/Tag";

import { getConnectorAvailabilityTone } from "@/lib/irve/formatters";
import type { ConnectorsTabProps } from "./shared";

export function StationConnectorsTab({ connectorStatusItems }: ConnectorsTabProps) {
  return (
    <div className="irve-sidepanel__tab-stack">
      <Card
        title="Connecteurs et état"
        desc={
          <div className="irve-sidepanel__connector-list">
            {connectorStatusItems.length > 0 ? (
              connectorStatusItems.map((connector) => (
                <div key={connector.label} className="irve-sidepanel__connector-item">
                  <div className="flex items-center gap-4 rounded-xl bg-(--background-default-grey) p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                          <Image
                            className="h-16 w-16 object-contain"
                            src={connector.iconPath}
                            alt=""
                            aria-hidden="true"
                            width={64}
                            height={64}
                          />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Tag small iconId="fr-icon-flashlight-line">{connector.label}</Tag>
                        <Badge severity={getConnectorAvailabilityTone(connector.status)}>
                          {connector.count} point{connector.count > 1 ? "s" : ""}
                        </Badge>
                      </div>
                      {/* <p className="mt-2 mb-0 text-sm leading-6 text-(--text-mention-grey)">
                        {connector.label === "Autre prise"
                          ? "Type de prise déclaré dans les données statiques, sans suivi dynamique dédié."
                          : connector.status
                            ? "État disponible dans le flux dynamique national."
                            : "Connecteur présent, mais état temps réel manquant dans le flux dynamique."}
                      </p> */}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="irve-sidepanel__missing">Aucun connecteur renseigné.</p>
            )}
          </div>
        }
        border
      />
    </div>
  );
}
