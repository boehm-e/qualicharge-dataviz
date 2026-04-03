export type ScheduleRow = {
  day: string;
  hours: string;
};

const DAY_LABELS: Record<string, string> = {
  Mo: "Lundi",
  Tu: "Mardi",
  We: "Mercredi",
  Th: "Jeudi",
  Fr: "Vendredi",
  Sa: "Samedi",
  Su: "Dimanche",
};

const DAY_ORDER = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const SCHEDULE_ENTRY_REGEX = /([A-Za-z]{2}(?:-[A-Za-z]{2})?(?:,[A-Za-z]{2}(?:-[A-Za-z]{2})?)*)\s+([^,;]+(?:-(?![A-Za-z]{2}\b)[^,;]+)*)/g;

function expandDayToken(token: string) {
  const trimmedToken = token.trim();
  if (!trimmedToken) {
    return [] as string[];
  }

  const rangeMatch = trimmedToken.match(/^([A-Za-z]{2})-([A-Za-z]{2})$/);
  if (!rangeMatch) {
    return [DAY_LABELS[trimmedToken] ?? trimmedToken];
  }

  const [, startDay, endDay] = rangeMatch;
  const startIndex = DAY_ORDER.indexOf(startDay);
  const endIndex = DAY_ORDER.indexOf(endDay);

  if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
    return [`${DAY_LABELS[startDay] ?? startDay} - ${DAY_LABELS[endDay] ?? endDay}`];
  }

  return DAY_ORDER.slice(startIndex, endIndex + 1).map((dayKey) => DAY_LABELS[dayKey]);
}

export function parseHoraires(horaires: string | null | undefined): ScheduleRow[] | null {
  if (!horaires) {
    return null;
  }

  const normalized = horaires.trim();
  if (!normalized) {
    return null;
  }

  if (normalized === "24/7") {
    return [{ day: "Tous les jours", hours: "24h/24" }];
  }

  const expandedRows = Array.from(normalized.matchAll(SCHEDULE_ENTRY_REGEX)).flatMap(
    ([, dayExpression, hours]) =>
      dayExpression.split(",").flatMap((token) =>
        expandDayToken(token).map((day) => ({
          day,
          hours: hours.trim(),
        }))
      )
  );

  if (expandedRows.length === 0) {
    return [{ day: normalized, hours: "" }];
  }

  return expandedRows;
}
