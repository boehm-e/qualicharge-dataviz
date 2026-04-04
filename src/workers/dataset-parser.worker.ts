import { asyncBufferFromUrl, parquetMetadataAsync, parquetReadObjects } from "hyparquet";
import { compressors } from "hyparquet-compressors";

import type { QualichargeEVSEStatique } from "@/types/irve";
import type {
  IRVEPointFeature,
  WorkerMessage,
} from "@/types/irve-runtime";

type CsvRow = Partial<Record<keyof QualichargeEVSEStatique, string>>;

const PARQUET_URL =
  "https://object.files.data.gouv.fr/hydra-parquet/hydra-parquet/8bb0a6e2-1016-42ba-aaee-f72f55c82e9f.parquet";
const ROW_BATCH_SIZE = 20_000;

let total = 0;
let nextId = 1;

function postWorkerMessage(message: WorkerMessage) {
  self.postMessage(message);
}

function toNumber(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInteger(value?: string, fallback = 1) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value?: string | boolean) {
  if (!value) {
    return false;
  }
  if (value === true) return true;

  return ["true", "1", "yes", "oui"].includes(value.trim().toLowerCase());
}

function toNullableBoolean(value?: string) {
  if (!value) {
    return null;
  }

  return toBoolean(value);
}

function toNullableString(value?: string) {
  return value && value.length > 0 ? value : null;
}

function toRequiredString(value?: string) {
  return value ?? "";
}

function toRow(row: CsvRow): QualichargeEVSEStatique {
  return {
    nom_amenageur: toRequiredString(row.nom_amenageur),
    siren_amenageur: toRequiredString(row.siren_amenageur) as QualichargeEVSEStatique["siren_amenageur"],
    contact_amenageur: toRequiredString(row.contact_amenageur),
    nom_operateur: toRequiredString(row.nom_operateur),
    contact_operateur: toRequiredString(row.contact_operateur),
    telephone_operateur: toRequiredString(row.telephone_operateur) as QualichargeEVSEStatique["telephone_operateur"],
    nom_enseigne: toRequiredString(row.nom_enseigne),
    id_station_itinerance: toRequiredString(row.id_station_itinerance),
    id_station_local: toNullableString(row.id_station_local),
    nom_station: toRequiredString(row.nom_station),
    implantation_station: toRequiredString(row.implantation_station) as QualichargeEVSEStatique["implantation_station"],
    adresse_station: toRequiredString(row.adresse_station),
    code_insee_commune: toRequiredString(row.code_insee_commune),
    coordonneesXY: toRequiredString(row.coordonneesXY) as QualichargeEVSEStatique["coordonneesXY"],
    nbre_pdc: toInteger(row.nbre_pdc, 0),
    id_pdc_itinerance: toRequiredString(row.id_pdc_itinerance),
    id_pdc_local: toNullableString(row.id_pdc_local),
    puissance_nominale: toNumber(row.puissance_nominale) ?? 0,
    prise_type_ef: toBoolean(row.prise_type_ef),
    prise_type_2: toBoolean(row.prise_type_2),
    prise_type_combo_ccs: toBoolean(row.prise_type_combo_ccs),
    prise_type_chademo: toBoolean(row.prise_type_chademo),
    prise_type_autre: toBoolean(row.prise_type_autre),
    gratuit: toNullableBoolean(row.gratuit),
    paiement_acte: toBoolean(row.paiement_acte),
    paiement_cb: toNullableBoolean(row.paiement_cb),
    paiement_autre: toNullableBoolean(row.paiement_autre),
    tarification: toNullableString(row.tarification),
    condition_acces: toRequiredString(row.condition_acces) as QualichargeEVSEStatique["condition_acces"],
    reservation: toBoolean(row.reservation),
    horaires: toRequiredString(row.horaires),
    accessibilite_pmr: toRequiredString(row.accessibilite_pmr) as QualichargeEVSEStatique["accessibilite_pmr"],
    restriction_gabarit: toRequiredString(row.restriction_gabarit),
    station_deux_roues: toBoolean(row.station_deux_roues),
    raccordement: toRequiredString(row.raccordement) as QualichargeEVSEStatique["raccordement"],
    num_pdl: toNullableString(row.num_pdl),
    date_mise_en_service: toNullableString(row.date_mise_en_service) as QualichargeEVSEStatique["date_mise_en_service"],
    observations: toNullableString(row.observations),
    date_maj: toRequiredString(row.date_maj) as QualichargeEVSEStatique["date_maj"],
    cable_t2_attache: toNullableBoolean(row.cable_t2_attache),
  };
}

function createFeature(row: CsvRow): IRVEPointFeature | null {
  console.log("ROW", row)
  if (row.coordonneesXY == null) return null;
  const coords = JSON.parse(row.coordonneesXY as string) as [string | number, string | number];
  const lat = toNumber(String(coords[1]));
  const lng = toNumber(String(coords[0]));

  if (lat === null || lng === null) {
    return null;
  }

  const id = nextId;
  nextId += 1;

  return {
    type: "Feature",
    id,
    properties: {
      cluster: false,
      id,
      row: toRow(row),
    },
    geometry: {
      type: "Point",
      coordinates: [lng, lat],
    },
  };
}

async function loadParquet() {
  postWorkerMessage({ type: "loading", message: "Fetching Parquet metadata..." });

  const file = await asyncBufferFromUrl({ url: PARQUET_URL });
  const metadata = await parquetMetadataAsync(file);
  const rowCount = Number(metadata.num_rows);

  postWorkerMessage({ type: "loading", message: "Parsing Parquet..." });

  for (let rowStart = 0; rowStart < rowCount; rowStart += ROW_BATCH_SIZE) {
    const rowEnd = Math.min(rowStart + ROW_BATCH_SIZE, rowCount);
    const rows = (await parquetReadObjects({
      file,
      compressors,
      rowStart,
      rowEnd,
    })) as CsvRow[];

    const points: IRVEPointFeature[] = [];

    for (const row of rows) {
      const point = createFeature(row);
      if (point) {
        points.push(point);
      }
    }

    if (points.length > 0) {
      total += points.length;
      postWorkerMessage({
        type: "chunk",
        points,
        total,
        batchSize: points.length,
      });
    }
  }

  postWorkerMessage({ type: "done", total });
}

void loadParquet().catch((error: Error) => {
  postWorkerMessage({ type: "error", message: error.message });
});
