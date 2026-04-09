import { asyncBufferFromUrl, parquetMetadataAsync, parquetReadObjects } from "hyparquet";
import { compressors } from "hyparquet-compressors";

import type {
  QualichargeEVSEConsolidated,
  QualichargeEVSEDynamic,
  QualichargeEVSEPlug,
  QualichargeEVSEStatique,
} from "@/types/irve";
import type {
  IRVEPointFeature,
  WorkerMessage,
} from "@/types/irve-runtime";

type StaticCsvRow = Partial<Record<keyof QualichargeEVSEStatique, string>>;
type DynamicCsvRow = Partial<Record<keyof QualichargeEVSEDynamic | "id_station_itinerance", string>>;

const STATIC_PARQUET_URL =
  "https://object.files.data.gouv.fr/hydra-parquet/hydra-parquet/8bb0a6e2-1016-42ba-aaee-f72f55c82e9f.parquet";
const DYNAMIC_PARQUET_URL =
  "https://object.files.data.gouv.fr/hydra-parquet/hydra-parquet/411443b1-6667-473f-8217-1c57c167408f.parquet";
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

function toStaticRow(row: StaticCsvRow): QualichargeEVSEStatique {
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

function toDynamicRow(row: DynamicCsvRow): QualichargeEVSEDynamic {
  return {
    id_pdc_itinerance: toRequiredString(row.id_pdc_itinerance),
    horodatage: toRequiredString(row.horodatage),
    etat_pdc: toRequiredString(row.etat_pdc) as QualichargeEVSEDynamic["etat_pdc"],
    occupation_pdc: toRequiredString(row.occupation_pdc) as QualichargeEVSEDynamic["occupation_pdc"],
    etat_prise_type_2: toNullableString(row.etat_prise_type_2) as QualichargeEVSEDynamic["etat_prise_type_2"],
    etat_prise_type_combo_ccs: toNullableString(
      row.etat_prise_type_combo_ccs
    ) as QualichargeEVSEDynamic["etat_prise_type_combo_ccs"],
    etat_prise_type_chademo: toNullableString(
      row.etat_prise_type_chademo
    ) as QualichargeEVSEDynamic["etat_prise_type_chademo"],
    etat_prise_type_ef: toNullableString(row.etat_prise_type_ef) as QualichargeEVSEDynamic["etat_prise_type_ef"],
  };
}

function getDynamicKey(idPdcItinerance?: string) {
  return toRequiredString(idPdcItinerance);
}

function getStationKey(idStationItinerance?: string, fallback?: string) {
  return toRequiredString(idStationItinerance) || toRequiredString(fallback);
}

async function loadDynamicRows() {
  const file = await asyncBufferFromUrl({ url: DYNAMIC_PARQUET_URL });
  const rows = (await parquetReadObjects({
    file,
    compressors,
  })) as DynamicCsvRow[];

  const dynamicMap = new Map<string, QualichargeEVSEDynamic>();

  for (const row of rows) {
    const dynamicRow = toDynamicRow(row);
    dynamicMap.set(getDynamicKey(dynamicRow.id_pdc_itinerance), dynamicRow);
  }

  return dynamicMap;
}

function createFeature(row: QualichargeEVSEConsolidated): IRVEPointFeature | null {
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
      row,
    },
    geometry: {
      type: "Point",
      coordinates: [lng, lat],
    },
  };
}

function consolidateStation(plugs: QualichargeEVSEPlug[]): QualichargeEVSEConsolidated | null {
  const firstPlug = plugs[0];
  if (!firstPlug) {
    return null;
  }

  let maxPower = 0;
  let hasPriseTypeEf = false;
  let hasPriseType2 = false;
  let hasPriseTypeComboCcs = false;
  let hasPriseTypeChademo = false;
  let hasPriseTypeAutre = false;

  for (const plug of plugs) {
    if (plug.puissance_nominale > maxPower) {
      maxPower = plug.puissance_nominale;
    }

    hasPriseTypeEf = hasPriseTypeEf || plug.prise_type_ef;
    hasPriseType2 = hasPriseType2 || plug.prise_type_2;
    hasPriseTypeComboCcs = hasPriseTypeComboCcs || plug.prise_type_combo_ccs;
    hasPriseTypeChademo = hasPriseTypeChademo || plug.prise_type_chademo;
    hasPriseTypeAutre = hasPriseTypeAutre || plug.prise_type_autre;
  }

  return {
    nom_amenageur: firstPlug.nom_amenageur,
    siren_amenageur: firstPlug.siren_amenageur,
    contact_amenageur: firstPlug.contact_amenageur,
    nom_operateur: firstPlug.nom_operateur,
    contact_operateur: firstPlug.contact_operateur,
    telephone_operateur: firstPlug.telephone_operateur,
    nom_enseigne: firstPlug.nom_enseigne,
    id_station_itinerance: firstPlug.id_station_itinerance,
    id_station_local: firstPlug.id_station_local,
    nom_station: firstPlug.nom_station,
    implantation_station: firstPlug.implantation_station,
    adresse_station: firstPlug.adresse_station,
    code_insee_commune: firstPlug.code_insee_commune,
    coordonneesXY: firstPlug.coordonneesXY,
    nbre_pdc: firstPlug.nbre_pdc,
    gratuit: firstPlug.gratuit,
    paiement_acte: firstPlug.paiement_acte,
    paiement_cb: firstPlug.paiement_cb,
    paiement_autre: firstPlug.paiement_autre,
    tarification: firstPlug.tarification,
    condition_acces: firstPlug.condition_acces,
    reservation: firstPlug.reservation,
    horaires: firstPlug.horaires,
    accessibilite_pmr: firstPlug.accessibilite_pmr,
    restriction_gabarit: firstPlug.restriction_gabarit,
    station_deux_roues: firstPlug.station_deux_roues,
    raccordement: firstPlug.raccordement,
    num_pdl: firstPlug.num_pdl,
    date_mise_en_service: firstPlug.date_mise_en_service,
    observations: firstPlug.observations,
    date_maj: firstPlug.date_maj,
    cable_t2_attache: firstPlug.cable_t2_attache,
    plugs,
    summary: {
      max_power: maxPower,
      has_prise_type_ef: hasPriseTypeEf,
      has_prise_type_2: hasPriseType2,
      has_prise_type_combo_ccs: hasPriseTypeComboCcs,
      has_prise_type_chademo: hasPriseTypeChademo,
      has_prise_type_autre: hasPriseTypeAutre,
    },
  };
}

async function loadParquet() {
  postWorkerMessage({ type: "loading", message: "Chargement des disponibilités des bornes..." });

  const dynamicMap = await loadDynamicRows();

  postWorkerMessage({ type: "loading", message: "Préparation des informations sur les bornes..." });

  const file = await asyncBufferFromUrl({ url: STATIC_PARQUET_URL });
  const metadata = await parquetMetadataAsync(file);
  const rowCount = Number(metadata.num_rows);
  const stationMap = new Map<string, QualichargeEVSEPlug[]>();

  postWorkerMessage({ type: "loading", message: "Organisation et mise en forme des données..." });

  for (let rowStart = 0; rowStart < rowCount; rowStart += ROW_BATCH_SIZE) {
    const rowEnd = Math.min(rowStart + ROW_BATCH_SIZE, rowCount);
    const rows = (await parquetReadObjects({
      file,
      compressors,
      rowStart,
      rowEnd,
    })) as StaticCsvRow[];

    for (const row of rows) {
      const staticRow = toStaticRow(row);
      const consolidatedRow: QualichargeEVSEPlug = {
        ...staticRow,
        dynamic: dynamicMap.get(getDynamicKey(staticRow.id_pdc_itinerance)),
      };
      const stationKey = getStationKey(staticRow.id_station_itinerance, staticRow.id_pdc_itinerance);
      const stationPlugs = stationMap.get(stationKey);

      if (stationPlugs) {
        stationPlugs.push(consolidatedRow);
      } else {
        stationMap.set(stationKey, [consolidatedRow]);
      }
    }
  }

  const stations = Array.from(stationMap.values());
  const points: IRVEPointFeature[] = [];

  for (const stationPlugs of stations) {
    const station = consolidateStation(stationPlugs);
    if (!station) {
      continue;
    }

    const point = createFeature(station);
    if (point) {
      points.push(point);
    }
  }

  total = points.length;
  if (points.length > 0) {
    postWorkerMessage({
      type: "chunk",
      points,
      total,
      batchSize: points.length,
    });
  }

  postWorkerMessage({ type: "done", total });
}

void loadParquet().catch((error: Error) => {
  postWorkerMessage({ type: "error", message: error.message });
});
