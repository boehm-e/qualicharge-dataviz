"use strict";
(() => {
  // src/workers/csv-parser.worker.ts
  var CSV_URL = "https://static.data.gouv.fr/resources/base-nationale-des-irve-infrastructures-de-recharge-pour-vehicules-electriques/20260401-060236/consolidation-etalab-schema-irve-statique-v-2.3.1-20260401.csv";
  var total = 0;
  var nextId = 1;
  function postWorkerMessage(message) {
    self.postMessage(message);
  }
  function toNumber(value) {
    if (!value) {
      return null;
    }
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  function toInteger(value, fallback = 1) {
    if (!value) {
      return fallback;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  function toBoolean(value) {
    if (!value) {
      return false;
    }
    return ["true", "1", "yes", "oui"].includes(value.trim().toLowerCase());
  }
  function toNullableBoolean(value) {
    if (!value) {
      return null;
    }
    return toBoolean(value);
  }
  function toNullableString(value) {
    return value && value.length > 0 ? value : null;
  }
  function toRequiredString(value) {
    return value != null ? value : "";
  }
  function toRow(row) {
    var _a;
    return {
      nom_amenageur: toRequiredString(row.nom_amenageur),
      siren_amenageur: toRequiredString(row.siren_amenageur),
      contact_amenageur: toRequiredString(row.contact_amenageur),
      nom_operateur: toRequiredString(row.nom_operateur),
      contact_operateur: toRequiredString(row.contact_operateur),
      telephone_operateur: toRequiredString(row.telephone_operateur),
      nom_enseigne: toRequiredString(row.nom_enseigne),
      id_station_itinerance: toRequiredString(row.id_station_itinerance),
      id_station_local: toNullableString(row.id_station_local),
      nom_station: toRequiredString(row.nom_station),
      implantation_station: toRequiredString(row.implantation_station),
      adresse_station: toRequiredString(row.adresse_station),
      code_insee_commune: toRequiredString(row.code_insee_commune),
      coordonneesXY: toRequiredString(row.coordonneesXY),
      nbre_pdc: toInteger(row.nbre_pdc, 0),
      id_pdc_itinerance: toRequiredString(row.id_pdc_itinerance),
      id_pdc_local: toNullableString(row.id_pdc_local),
      puissance_nominale: (_a = toNumber(row.puissance_nominale)) != null ? _a : 0,
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
      condition_acces: toRequiredString(row.condition_acces),
      reservation: toBoolean(row.reservation),
      horaires: toRequiredString(row.horaires),
      accessibilite_pmr: toRequiredString(row.accessibilite_pmr),
      restriction_gabarit: toRequiredString(row.restriction_gabarit),
      station_deux_roues: toBoolean(row.station_deux_roues),
      raccordement: toRequiredString(row.raccordement),
      num_pdl: toNullableString(row.num_pdl),
      date_mise_en_service: toNullableString(row.date_mise_en_service),
      observations: toNullableString(row.observations),
      date_maj: toRequiredString(row.date_maj),
      cable_t2_attache: toNullableBoolean(row.cable_t2_attache)
    };
  }
  function createFeature(row) {
    const lat = toNumber(row.consolidated_latitude);
    const lng = toNumber(row.consolidated_longitude);
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
        row: toRow(row)
      },
      geometry: {
        type: "Point",
        coordinates: [lng, lat]
      }
    };
  }
  importScripts("https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js");
  postWorkerMessage({ type: "loading", message: "Fetching CSV..." });
  fetch(CSV_URL).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    postWorkerMessage({ type: "loading", message: "Parsing CSV..." });
    return response.text();
  }).then((csvText) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      chunk(results) {
        if (results.errors.length > 0) {
          const criticalErrors = results.errors.filter(
            (error) => error.type === "FieldMismatch" && error.code === "TooFewFields"
          );
          if (criticalErrors.length > 0) {
            console.warn(`Chunk had ${criticalErrors.length} rows with too few fields`);
          }
        }
        const points = [];
        for (const row of results.data) {
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
            batchSize: points.length
          });
        }
      },
      complete() {
        postWorkerMessage({ type: "done", total });
      },
      error(error) {
        postWorkerMessage({ type: "error", message: error.message });
      }
    });
  }).catch((error) => {
    postWorkerMessage({ type: "error", message: error.message });
  });
})();
