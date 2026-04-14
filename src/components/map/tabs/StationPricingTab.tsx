import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Card } from "@codegouvfr/react-dsfr/Card";

import { getPricingHeadline, getStationPricing } from "@/lib/irve/pricing";
import type { StationDetailsTabProps } from "./shared";

function renderAmount(value: number | undefined, suffix: string) {
  if (typeof value !== "number") {
    return null;
  }

  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 4 })} EUR${suffix}`;
}

export function StationPricingTab({ station }: StationDetailsTabProps) {
  const pricing = getStationPricing(station);
  const headline = getPricingHeadline(pricing);

  return (
    <div className="irve-sidepanel__tab-stack">
      <Card
        title="Tarification extraite"
        desc={
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge severity={pricing.status === "FREE" ? "success" : pricing.status === "UNKNOWN" ? "new" : "info"}>
                {pricing.status}
              </Badge>
              {headline ? <Badge severity="info">{headline}</Badge> : null}
            </div>

            <dl className="irve-sidepanel__facts">
              <div>
                <dt>Prix par kWh</dt>
                <dd>{renderAmount(pricing.pricePerKwh, "/kWh") ?? "Non détecté"}</dd>
              </div>
              <div>
                <dt>Frais de session</dt>
                <dd>{renderAmount(pricing.startFee, "/session") ?? "Non détecté"}</dd>
              </div>
              <div>
                <dt>Frais par heure de charge</dt>
                <dd>{renderAmount(pricing.chargeFeePerHour, "/h") ?? "Non détecté"}</dd>
              </div>
              <div>
                <dt>Frais d'occupation</dt>
                <dd>{renderAmount(pricing.idleFeePerHour, "/h") ?? "Non détecté"}</dd>
              </div>
              <div>
                <dt>Frais de parking a la minute</dt>
                <dd>{renderAmount(pricing.idleFeePerMin, "/min") ?? "Non détecté"}</dd>
              </div>
              <div>
                <dt>Source brute</dt>
                <dd>{pricing.originalText || "Non renseignée"}</dd>
              </div>
            </dl>
          </div>
        }
        border
      />

      {pricing.timeTiers?.length ? (
        <Card
          title="Tranches horaires"
          desc={
            <div className="space-y-2 text-sm">
              {pricing.timeTiers.map((tier) => (
                <div key={`${tier.startTime}-${tier.endTime}`} className="rounded border border-slate-200 p-3">
                  <p className="m-0 font-medium">{tier.startTime} - {tier.endTime}</p>
                  <p className="m-0 text-slate-700">
                    {renderAmount(tier.pricePerKwh, "/kWh") ?? "Pas de prix kWh detecte"}
                    {tier.chargeFeePerHour ? ` · ${renderAmount(tier.chargeFeePerHour, "/h charge")}` : ""}
                    {tier.idleFeePerHour ? ` · ${renderAmount(tier.idleFeePerHour, "/h occupation")}` : ""}
                  </p>
                </div>
              ))}
            </div>
          }
          border
        />
      ) : null}

      {pricing.alternativePlans?.length ? (
        <Card
          title="Plans alternatifs"
          desc={
            <div className="space-y-2 text-sm">
              {pricing.alternativePlans.map((plan, index) => (
                <div key={`plan-${index + 1}`} className="rounded border border-slate-200 p-3">
                  <p className="m-0 font-medium">Plan {index + 1}</p>
                  <p className="m-0 text-slate-700">
                    {renderAmount(plan.pricePerKwh, "/kWh") ?? "Pas de prix kWh detecte"}
                    {plan.startFee ? ` · ${renderAmount(plan.startFee, "/session")}` : ""}
                    {plan.chargeFeePerHour ? ` · ${renderAmount(plan.chargeFeePerHour, "/h charge")}` : ""}
                    {plan.idleFeePerHour ? ` · ${renderAmount(plan.idleFeePerHour, "/h parking")}` : ""}
                  </p>
                </div>
              ))}
            </div>
          }
          border
        />
      ) : null}
    </div>
  );
}
