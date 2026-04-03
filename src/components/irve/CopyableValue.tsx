"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";

import type { DetailItem } from "@/lib/irve/sections";

export interface CopyableValueProps {
  item: DetailItem;
  displayValue: string;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
}

export function CopyableValue({ item, displayValue, copiedKey, onCopy }: CopyableValueProps) {
  const copyKey = `section-${item.label}`;
  const isCopied = copiedKey === copyKey;

  return (
    <div className="irve-sidepanel__fact-row">
      <div>
        <dt>{item.label}</dt>
        <dd>{displayValue}</dd>
      </div>

      {item.copyable && item.rawValue ? (
        <Button
          priority="tertiary no outline"
          size="small"
          iconId={isCopied ? "fr-icon-check-line" : "fr-icon-clipboard-line"}
          title={isCopied ? `${item.label} copie` : `Copier ${item.label.toLowerCase()}`}
          onClick={() => onCopy(copyKey, item.rawValue!)}
        >
          {isCopied ? "Copie" : "Copier"}
        </Button>
      ) : null}
    </div>
  );
}
