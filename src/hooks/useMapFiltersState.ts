"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_MAP_FILTERS,
  getActiveFilterCount,
  type AccessFilter,
  type MapFiltersState,
  type PowerFilterId,
} from "@/lib/irve/mapFilters";
import { useDebouncedValue } from "./useDebouncedValue";

const SEARCH_DEBOUNCE_MS = 250;

function toggleListValue<T extends string>(items: T[], value: T) {
  return items.includes(value)
    ? items.filter((item) => item !== value)
    : [...items, value];
}

export function useMapFiltersState() {
  const [filters, setFilters] = useState<MapFiltersState>(DEFAULT_MAP_FILTERS);
  const [itineranceInputValue, setItineranceInputValue] = useState(DEFAULT_MAP_FILTERS.itineranceQuery);
  const [operatorInputValue, setOperatorInputValue] = useState(DEFAULT_MAP_FILTERS.operatorQuery);

  const debouncedItineranceQuery = useDebouncedValue(itineranceInputValue.trim(), SEARCH_DEBOUNCE_MS);
  const debouncedOperatorQuery = useDebouncedValue(operatorInputValue.trim(), SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    startTransition(() => {
      setFilters((current) =>
        current.itineranceQuery === debouncedItineranceQuery
          ? current
          : { ...current, itineranceQuery: debouncedItineranceQuery }
      );
    });
  }, [debouncedItineranceQuery]);

  useEffect(() => {
    startTransition(() => {
      setFilters((current) =>
        current.operatorQuery === debouncedOperatorQuery
          ? current
          : { ...current, operatorQuery: debouncedOperatorQuery }
      );
    });
  }, [debouncedOperatorQuery]);

  const resetFilters = useCallback(() => {
    setItineranceInputValue(DEFAULT_MAP_FILTERS.itineranceQuery);
    setOperatorInputValue(DEFAULT_MAP_FILTERS.operatorQuery);
    setFilters(DEFAULT_MAP_FILTERS);
  }, []);

  const setAccess = useCallback((access: AccessFilter) => {
    setFilters((current) => ({ ...current, access }));
  }, []);

  const togglePower = useCallback((value: PowerFilterId) => {
    setFilters((current) => ({
      ...current,
      power: toggleListValue(current.power, value),
    }));
  }, []);

  const toggleConnector = useCallback((value: MapFiltersState["connectors"][number]) => {
    setFilters((current) => ({
      ...current,
      connectors: toggleListValue(current.connectors, value),
    }));
  }, []);

  const togglePayment = useCallback((value: MapFiltersState["payment"][number]) => {
    setFilters((current) => ({
      ...current,
      payment: toggleListValue(current.payment, value),
    }));
  }, []);

  const toggleReservation = useCallback(() => {
    setFilters((current) => ({ ...current, reservationOnly: !current.reservationOnly }));
  }, []);

  const togglePmr = useCallback(() => {
    setFilters((current) => ({ ...current, pmrOnly: !current.pmrOnly }));
  }, []);

  const toggleTwoWheels = useCallback(() => {
    setFilters((current) => ({ ...current, twoWheelsOnly: !current.twoWheelsOnly }));
  }, []);

  const activeFilterCount = useMemo(() => getActiveFilterCount(filters), [filters]);

  return {
    filters,
    itineranceInputValue,
    operatorInputValue,
    activeFilterCount,
    setItineranceInputValue,
    setOperatorInputValue,
    resetFilters,
    setAccess,
    togglePower,
    toggleConnector,
    togglePayment,
    toggleReservation,
    togglePmr,
    toggleTwoWheels,
  };
}
