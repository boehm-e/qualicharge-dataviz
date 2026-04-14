import type { QualichargeEVSEConsolidated } from "@/types/irve";

export type PricingStatus = "STANDARD" | "FREE" | "UNKNOWN" | "VARIABLE" | "URL_ONLY" | "MULTI_PLAN";

export interface PricingTier {
  startTime?: string;
  endTime?: string;
  pricePerKwh?: number;
  idleFeePerHour?: number;
  chargeFeePerHour?: number;
}

export interface ExtractedPrice {
  operator: string;
  status: PricingStatus;
  currency: "EUR";
  startFee?: number;
  pricePerKwh?: number;
  chargeFeePerHour?: number;
  idleFeePerHour?: number;
  idleFeePerMin?: number;
  timeTiers?: PricingTier[];
  alternativePlans?: Partial<ExtractedPrice>[];
  url?: string;
  originalText: string;
}

function parseNum(str?: string): number | undefined {
  if (!str) return undefined;
  const num = Number.parseFloat(str.replace(",", "."));
  return Number.isNaN(num) ? undefined : num;
}

function extractBlockMetrics(text: string): Partial<ExtractedPrice> {
  const data: Partial<ExtractedPrice> = {};

  const kwhMatch = text.match(/([0-9]+[.,]?[0-9]*)\s*(?:€|E|EUR)\s*(?:TTC\s*)?(?:par|[\/])\s*(?:kwh|kWh)/i);
  if (kwhMatch) data.pricePerKwh = parseNum(kwhMatch[1]);

  const ctsMatch = text.match(/([0-9]+[.,]?[0-9]*)\s*cts\s*\/\s*kWh/i);
  if (ctsMatch) data.pricePerKwh = (parseNum(ctsMatch[1]) || 0) / 100;

  if (!data.pricePerKwh && text.match(/^([0-9]+[.,]?[0-9]*)\s*€$/)) {
    const match = text.match(/^([0-9]+[.,]?[0-9]*)\s*€$/);
    data.pricePerKwh = parseNum(match?.[1]);
  }

  const idleHourMatch = text.match(/([0-9]+[.,]?[0-9]*)\s*(?:€|E|EUR)\s*(?:TTC\s*)?par\s*heure\s*(?:d'occupation|de\s*parking)/i);
  if (idleHourMatch) data.idleFeePerHour = parseNum(idleHourMatch[1]);

  const idle15MinMatch = text.match(/([0-9]+[.,]?[0-9]*)\s*(?:€|E|EUR)\s*(?:TTC\s*)?(?:par|[\/])\s*15\s*min/i);
  if (idle15MinMatch && !data.idleFeePerHour) {
    data.idleFeePerHour = (parseNum(idle15MinMatch[1]) || 0) * 4;
  }

  const idleMinMatch = text.match(/([0-9]+[.,]?[0-9]*)\s*(?:€|E|EUR)\s*(?:TTC\s*)?(?:par|[\/])\s*min\s*de\s*parking/i);
  if (idleMinMatch) data.idleFeePerMin = parseNum(idleMinMatch[1]);

  const chargeHourMatch = text.match(/([0-9]+[.,]?[0-9]*)\s*(?:€|E|EUR)\s*(?:TTC\s*)?par\s*heure\s*de\s*charge/i);
  if (chargeHourMatch) data.chargeFeePerHour = parseNum(chargeHourMatch[1]);

  const baseMatch = text.match(/(?:prix\s*de\s*départ\s*|cout\s*fixe.*?)([0-9]+[.,]?[0-9]*)\s*(?:€|E|EUR)|([0-9]+[.,]?[0-9]*)\s*(?:€|E|EUR)\s*(?:TTC\s*)?par\s*recharge/i);
  if (baseMatch) {
    data.startFee = parseNum(baseMatch[1] || baseMatch[2]);
  }

  return data;
}

export function parseTarification(tarification: string | null | undefined, operator: string): ExtractedPrice {
  const rawText = tarification?.trim() ?? "";

  const result: ExtractedPrice = {
    operator,
    status: "STANDARD",
    currency: "EUR",
    originalText: rawText,
  };

  if (rawText === "-" || rawText.toLowerCase() === "inconnu" || rawText === "") {
    result.status = "UNKNOWN";
    return result;
  }
  if (rawText.startsWith("http")) {
    result.status = "URL_ONLY";
    result.url = rawText;
    return result;
  }
  if (rawText.toLowerCase().includes("gratuite") && !rawText.toLowerCase().includes("kwh")) {
    result.status = "FREE";
    return result;
  }
  if (operator === "IZIVIA" && rawText.includes("varier en fonction de plusieurs facteurs")) {
    result.status = "VARIABLE";
    return result;
  }

  if (rawText.includes("|")) {
    result.status = "MULTI_PLAN";
    result.alternativePlans = rawText.split("|").map((planText) => extractBlockMetrics(planText.trim()));
    return result;
  }

  const defaultBlock = rawText.split(/entre \d{2}:\d{2} et \d{2}:\d{2}/)[0];
  Object.assign(result, extractBlockMetrics(defaultBlock));

  const tierRegex = /entre (\d{2}:\d{2}) et (\d{2}:\d{2}) : (.*?)(?=entre \d{2}:\d{2}|$)/g;
  const timeTiers: PricingTier[] = [];
  let match: RegExpExecArray | null;

  while ((match = tierRegex.exec(rawText)) !== null) {
    const tierMetrics = extractBlockMetrics(match[3]);
    timeTiers.push({
      startTime: match[1],
      endTime: match[2],
      pricePerKwh: tierMetrics.pricePerKwh,
      idleFeePerHour: tierMetrics.idleFeePerHour,
      chargeFeePerHour: tierMetrics.chargeFeePerHour,
    });
  }

  if (timeTiers.length > 0) {
    result.timeTiers = timeTiers;
  }

  return result;
}

function formatAmount(value: number, suffix: string) {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 4 })} EUR${suffix}`;
}

function formatDecimalAmount(value: number, minimumFractionDigits = 2, maximumFractionDigits = 4) {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits,
    maximumFractionDigits,
  });
}

export function getPricingHeadline(pricing: ExtractedPrice): string | null {
  switch (pricing.status) {
    case "FREE":
      return "Gratuit";
    case "UNKNOWN":
      return null;
    case "VARIABLE":
      return "Tarif variable";
    case "URL_ONLY":
      return "Voir site";
    case "MULTI_PLAN": {
      const firstPlan = pricing.alternativePlans?.find((plan) => typeof plan.pricePerKwh === "number");
      if (typeof firstPlan?.pricePerKwh === "number") {
        return `Dès ${formatAmount(firstPlan.pricePerKwh, "/kWh")}`;
      }
      return "Multi-tarifs";
    }
    default:
      if (typeof pricing.pricePerKwh === "number") {
        return formatAmount(pricing.pricePerKwh, "/kWh");
      }
      if (typeof pricing.startFee === "number") {
        return formatAmount(pricing.startFee, "/session");
      }
      if (typeof pricing.chargeFeePerHour === "number") {
        return formatAmount(pricing.chargeFeePerHour, "/h charge");
      }
      return null;
  }
}

export function getPricingSortValue(pricing: ExtractedPrice): number | null {
  if (pricing.status === "FREE") {
    return 0;
  }
  if (typeof pricing.pricePerKwh === "number") {
    return pricing.pricePerKwh;
  }
  if (pricing.status === "MULTI_PLAN") {
    const values = (pricing.alternativePlans ?? [])
      .map((plan) => plan.pricePerKwh)
      .filter((value): value is number => typeof value === "number");
    return values.length > 0 ? Math.min(...values) : null;
  }
  return null;
}

export function getStationPricing(station: QualichargeEVSEConsolidated) {
  return parseTarification(station.tarification, station.nom_operateur);
}

export interface PricingMarkerContent {
  topLabel: string;
  bottomLabel: string;
}

export function getPricingMarkerContent(pricing: ExtractedPrice): PricingMarkerContent {
  if (pricing.status === "FREE") {
    return {
      topLabel: "Gratuit",
      bottomLabel: "par kWh",
    };
  }

  if (typeof pricing.pricePerKwh === "number") {
    return {
      topLabel: `${formatDecimalAmount(pricing.pricePerKwh)} EUR`,
      bottomLabel: "par kWh",
    };
  }

  if (pricing.status === "MULTI_PLAN") {
    const values = (pricing.alternativePlans ?? [])
      .map((plan) => plan.pricePerKwh)
      .filter((value): value is number => typeof value === "number");

    if (values.length > 0) {
      return {
        topLabel: `${formatDecimalAmount(Math.min(...values))} EUR`,
        bottomLabel: "par kWh",
      };
    }
  }

  if (pricing.status === "VARIABLE") {
    return {
      topLabel: "Variable",
      bottomLabel: "selon conditions",
    };
  }

  if (pricing.status === "URL_ONLY") {
    return {
      topLabel: "Voir site",
      bottomLabel: "tarif externe",
    };
  }

  if (typeof pricing.startFee === "number") {
    return {
      topLabel: `${formatDecimalAmount(pricing.startFee)} EUR`,
      bottomLabel: "par session",
    };
  }

  if (typeof pricing.chargeFeePerHour === "number") {
    return {
      topLabel: `${formatDecimalAmount(pricing.chargeFeePerHour)} EUR`,
      bottomLabel: "par heure",
    };
  }

  return {
    topLabel: "Tarif",
    bottomLabel: "non detecte",
  };
}
