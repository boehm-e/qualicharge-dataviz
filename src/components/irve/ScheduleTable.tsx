"use client";

import { Table } from "@codegouvfr/react-dsfr/Table";

import { parseHoraires } from "@/lib/irve/schedules";

export function ScheduleTable({ horaires }: { horaires: string }) {
  const rows = parseHoraires(horaires);

  if (!rows) {
    return <p className="irve-sidepanel__empty">Horaires non renseignés.</p>;
  }

  return (
    <div className="[&_table]:table!">
      <Table
        noCaption
        style={{ display: "table!important" }}
        bordered
        data={rows.map((row) => [row.day, row.hours || "Voir detail source"])}
        headers={["Jour", "Horaires"]}
        className="irve-sidepanel__schedule"
      />
    </div>
  );
}
