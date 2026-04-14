"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";

import {
  CONNECTOR_FILTER_OPTIONS,
  PAYMENT_FILTER_OPTIONS,
  POWER_FILTER_OPTIONS,
  type MapFiltersState,
} from "@/lib/irve/mapFilters";
import { MapSidePanel } from "./MapSidePanel";

interface MapFiltersPanelProps {
  filters: MapFiltersState;
  isOpen: boolean;
  activeCount: number;
  stationCount: number;
  pointCount: number;
  onClose: () => void;
  onReset: () => void;
  onAccessChange: (value: MapFiltersState["access"]) => void;
  onTogglePower: (value: typeof POWER_FILTER_OPTIONS[number]["id"]) => void;
  onToggleConnector: (value: typeof CONNECTOR_FILTER_OPTIONS[number]["id"]) => void;
  onTogglePayment: (value: typeof PAYMENT_FILTER_OPTIONS[number]["id"]) => void;
  onItineranceQueryChange: (value: string) => void;
  onOperatorQueryChange: (value: string) => void;
  onToggleReservation: () => void;
  onTogglePmr: () => void;
  onToggleTwoWheels: () => void;
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delay, value]);

  return debouncedValue;
}

interface CheckboxOption {
  checked: boolean;
  hintText?: string;
  label: string;
  onChange: () => void;
}

function FilterCheckboxGroup({
  legend,
  options,
}: {
  legend: string;
  options: CheckboxOption[];
}) {
  return (
    <Checkbox
      small
      legend={legend}
      options={options.map((option) => ({
        label: option.label,
        hintText: option.hintText,
        nativeInputProps: {
          checked: option.checked,
          onChange: option.onChange,
        },
      }))}
    />
  );
}

function FilterAccordionSection({
  label,
  children,
}: {
  label: string;
  children: NonNullable<ReactNode>;
}) {
  const [expanded, setExpanded] = useState(true);
  const contentRef = useRef<HTMLDivElement | null>(null);
  // FIX: last version of react-dsfr (1.32.0) must have an issue with accordion causing expanded accordion to not expand to desired height. 
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) {
      return;
    }

    const updateHeight = () => {
      setContentHeight(node.scrollHeight);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Accordion
      label={label}
      expanded={expanded}
      onExpandedChange={(nextExpanded) => setExpanded(nextExpanded)}
      // BUG: last version of react-dsfr (1.32.0) does not add relevent collapse classes...
      classes={{
        collapse: "irve-filter-accordion__collapse fr-collapse--expanded",
      }}
    >
      <div
        className={`irve-filter-accordion__inner${expanded ? " is-expanded" : ""}`}
        style={{ maxHeight: expanded ? `${contentHeight}px` : "0px" }}
      >
        <div ref={contentRef} className="irve-filter-accordion__content">
          {children}
        </div>
      </div>
    </Accordion>
  );
}

export function MapFiltersPanel({
  filters,
  isOpen,
  activeCount,
  stationCount,
  pointCount,
  onClose,
  onReset,
  onAccessChange,
  onTogglePower,
  onToggleConnector,
  onTogglePayment,
  onItineranceQueryChange,
  onOperatorQueryChange,
  onToggleReservation,
  onTogglePmr,
  onToggleTwoWheels,
}: MapFiltersPanelProps) {
  const isInitializedRef = useRef(false);
  const [itineranceInput, setItineranceInput] = useState(() => filters.itineranceQuery);
  const [operatorInput, setOperatorInput] = useState(() => filters.operatorQuery);
  const debouncedItineranceInput = useDebouncedValue(itineranceInput, 250);
  const debouncedOperatorInput = useDebouncedValue(operatorInput, 250);

  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }

    onItineranceQueryChange(debouncedItineranceInput.trim());
  }, [debouncedItineranceInput, onItineranceQueryChange]);

  useEffect(() => {
    onOperatorQueryChange(debouncedOperatorInput.trim());
  }, [debouncedOperatorInput, onOperatorQueryChange]);

  const serviceToggles = [
    {
      checked: filters.reservationOnly,
      helperText: "Ne garder que les stations proposant une reservation.",
      label: "Reservation",
      onChange: onToggleReservation,
    },
    {
      checked: filters.pmrOnly,
      helperText: "Masquer les stations declarees non accessibles.",
      label: "Accessibilite PMR",
      onChange: onTogglePmr,
    },
    {
      checked: filters.twoWheelsOnly,
      helperText: "Afficher uniquement les stations compatibles deux-roues.",
      label: "Compatibilite deux-roues",
      onChange: onToggleTwoWheels,
    },
  ] as const;

  return (
    <MapSidePanel
      id="map-filters"
      className="z-20"
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Carte de recharge"
      title="Filtres"
      subtitle="Affinez les stations visibles sur la carte et dans les clusters."
    >
      <Card
        title="Résultats visibles"
        titleAs="h3"
        size="small"
        border
        desc={
          <div className="irve-filters-panel__summary">
            <div className="irve-filters-panel__summary-copy">
              <strong>{stationCount} stations</strong>
              <span>{pointCount} points de charge apres filtrage</span>
            </div>

            <div className="irve-filters-panel__summary-badges">
              <Badge severity={activeCount > 0 ? "info" : "new"}>
                {activeCount} filtre{activeCount > 1 ? "s" : ""} actif{activeCount > 1 ? "s" : ""}
              </Badge>
              <Button
                priority="secondary"
                size="small"
                iconId="fr-icon-refresh-line"
                disabled={activeCount === 0}
                onClick={onReset}
              >
                Reinitialiser
              </Button>
            </div>
          </div>
        }
      />

      <Card
        title="Recherche ciblée"
        titleAs="h3"
        size="small"
        border
        desc={
          <div className="flex flex-col gap-4">
            <Input
              label="Identifiant station ou point"
              hintText="Recherche sur `id_station_itinerance` et `id_pdc_itinerance`. Une saisie partielle fonctionne, par exemple les 5 premiers caracteres de l'unite d'exploitation."
              nativeInputProps={{
                type: "search",
                value: itineranceInput,
                placeholder: "Ex. FRTSLP29984",
                onChange: (event) => setItineranceInput(event.currentTarget.value),
              }}
            />

            <Input
              label="Operateur ou amenageur"
              hintText="Recherche libre sur les noms d'operateur et d'amenageur. Exemple : Tesla."
              nativeInputProps={{
                type: "search",
                value: operatorInput,
                placeholder: "Ex. Tesla, Izivia, Electra",
                onChange: (event) => setOperatorInput(event.currentTarget.value),
              }}
            />
          </div>
        }
      />

      <SegmentedControl
        small
        legend="Acces"
        segments={[
          {
            label: "Toutes",
            nativeInputProps: {
              checked: filters.access === "all",
              onChange: () => onAccessChange("all"),
            },
          },
          {
            label: "Acces libre",
            nativeInputProps: {
              checked: filters.access === "free",
              onChange: () => onAccessChange("free"),
            },
          },
          {
            label: "Acces reserve",
            nativeInputProps: {
              checked: filters.access === "restricted",
              onChange: () => onAccessChange("restricted"),
            },
          },
        ]}
      />

      <FilterAccordionSection label="Puissance">
        <FilterCheckboxGroup
          legend="Puissance de recharge"
          options={POWER_FILTER_OPTIONS.map((option) => ({
            checked: filters.power.includes(option.id),
            hintText: option.description,
            label: option.label,
            onChange: () => onTogglePower(option.id),
          }))}
        />
      </FilterAccordionSection>

      <FilterAccordionSection label="Connecteurs">
        <FilterCheckboxGroup
          legend="Connecteurs disponiblés"
          options={CONNECTOR_FILTER_OPTIONS.map((option) => ({
            checked: filters.connectors.includes(option.id),
            label: option.label,
            onChange: () => onToggleConnector(option.id),
          }))}
        />
      </FilterAccordionSection>

      <FilterAccordionSection label="Paiement">
        <FilterCheckboxGroup
          legend="Moyens de paiement"
          options={PAYMENT_FILTER_OPTIONS.map((option) => ({
            checked: filters.payment.includes(option.id),
            label: option.label,
            onChange: () => onTogglePayment(option.id),
          }))}
        />
      </FilterAccordionSection>

      <FilterAccordionSection label="Services et accessibilité">
        <div className="irve-filters-panel__toggles">
          {serviceToggles.map((toggle) => (
            <ToggleSwitch
              labelPosition="left"
              key={toggle.label}
              checked={toggle.checked}
              label={toggle.label}
              helperText={toggle.helperText}
              showCheckedHint={false}
              onChange={toggle.onChange}
            />
          ))}
        </div>
      </FilterAccordionSection>

    </MapSidePanel>
  );
}
