import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { Notice } from "@codegouvfr/react-dsfr/Notice";
import { Tag } from "@codegouvfr/react-dsfr/Tag";

import {
  getPricingFacts,
  getPricingHeadline,
  getPricingStatusLabel,
  getStationPricing,
  hasStructuredPricing,
} from "@/lib/irve/pricing";
import type { StationDetailsTabProps } from "./shared";

function renderAmount(value: number | undefined, suffix: string) {
  if (typeof value !== "number") {
    return null;
  }

  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 4 })} €${suffix}`;
}

function getPlanTags(plan: {
  pricePerKwh?: number;
  startFee?: number;
  chargeFeePerHour?: number;
  idleFeePerHour?: number;
}) {
  return [
    typeof plan.pricePerKwh === "number" ? { label: renderAmount(plan.pricePerKwh, "/kWh") ?? "", iconId: "fr-icon-flashlight-line" as const } : null,
    typeof plan.startFee === "number" ? { label: renderAmount(plan.startFee, "/session") ?? "", iconId: "fr-icon-play-circle-line" as const } : null,
    typeof plan.chargeFeePerHour === "number" ? { label: renderAmount(plan.chargeFeePerHour, "/h charge") ?? "", iconId: "fr-icon-time-line" as const } : null,
    typeof plan.idleFeePerHour === "number" ? { label: renderAmount(plan.idleFeePerHour, "/h occupation") ?? "", iconId: "fr-icon-car-line" as const } : null,
  ].filter((tag): tag is { label: string; iconId: "fr-icon-flashlight-line" | "fr-icon-play-circle-line" | "fr-icon-time-line" | "fr-icon-car-line" } => tag !== null);
}

export function StationPricingTab({ station }: StationDetailsTabProps) {
  const pricing = getStationPricing(station);
  const facts = getPricingFacts(pricing);
  const hasStructuredData = hasStructuredPricing(pricing);
  return (
    <div className="irve-sidepanel__tab-stack">
      <Card
        title="Tarification"
        desc={
          <div className="grid gap-4 text-sm">

            {facts.length > 0 ? (
              <dl className="irve-sidepanel__facts">
                {facts.map((fact) => (
                  <div key={fact.label} className="irve-sidepanel__fact-row">
                    <div>
                      <dt>{fact.label}</dt>
                    </div>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {pricing.status === "URL_ONLY" && pricing.url ? (
              <Notice
                severity="info"
                title="Tarification externe"
                description="Le détail des tarifs est disponible sur le site de l'opérateur."
                link={{
                  text: "Consulter la tarification",
                  linkProps: {
                    href: pricing.url,
                    target: "_blank",
                    rel: "noreferrer",
                  },
                }}
              />
            ) : null}

            {!hasStructuredData && pricing.status !== "URL_ONLY" ? (
              <Notice
                severity="info"
                title="Tarification non exploitable"
                description="L’opérateur de cette station ne nous a pas communiqué le tarif."
              />
            ) : null}

            {pricing.originalText ? (
              <div className="border-t border-slate-200 pt-2">
                <p className="irve-sidepanel__label">Source brute</p>
                <p className="irve-sidepanel__value">{pricing.originalText}</p>
              </div>
            ) : null}
          </div>
        }
        border
      />

      {pricing.timeTiers?.length ? (
        <Card
          title="Tranches horaires"
          desc={
            <div className="grid gap-3 text-sm">
              {pricing.timeTiers.map((tier) => (
                <div key={`${tier.startTime}-${tier.endTime}`} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="m-0 text-[0.95rem] font-bold text-slate-900">{tier.startTime} - {tier.endTime}</p>
                  <div className="flex flex-wrap gap-2">
                    {getPlanTags(tier).map((tag) => <Tag key={`${tier.startTime}-${tier.endTime}-${tag.label}`} small iconId={tag.iconId}>{tag.label}</Tag>)}
                  </div>
                  {typeof tier.pricePerKwh !== "number" && typeof tier.chargeFeePerHour !== "number" && typeof tier.idleFeePerHour !== "number" ? (
                    <Notice severity="info" title="Aucun détail détecté" description="Aucun tarif détaillé détecté sur cette tranche." />
                  ) : null}
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
            <div className="grid gap-3 text-sm">
              {pricing.alternativePlans.map((plan, index) => (
                <div key={`plan-${index + 1}`} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="m-0 text-[0.95rem] font-bold text-slate-900">Plan {index + 1}</p>
                  <div className="flex flex-wrap gap-2">
                    {getPlanTags(plan).map((tag) => <Tag key={`plan-${index + 1}-${tag.label}`} small iconId={tag.iconId}>{tag.label}</Tag>)}
                  </div>
                  {typeof plan.pricePerKwh !== "number" && typeof plan.startFee !== "number" && typeof plan.chargeFeePerHour !== "number" && typeof plan.idleFeePerHour !== "number" ? (
                    <Notice severity="info" title="Aucun détail détecté" description="Aucun détail exploitable détecté pour ce plan." />
                  ) : null}
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
