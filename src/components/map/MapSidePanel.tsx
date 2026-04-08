"use client";

import type { ReactNode } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";

interface MapSidePanelProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  bodyClassName?: string;
  labelledById?: string;
  withBackdrop?: boolean;
}

export function MapSidePanel({
  id,
  isOpen,
  onClose,
  title,
  subtitle,
  eyebrow,
  children,
  className = "",
  contentClassName = "",
  bodyClassName = "",
  labelledById,
  withBackdrop = false,
}: MapSidePanelProps) {
  const titleId = labelledById ?? `${id}-title`;

  return (
    <aside
      id={id}
      className={`irve-sidepanel${isOpen ? " is-open" : ""}${className ? ` ${className}` : ""}`}
      aria-hidden={!isOpen}
    >
      {withBackdrop ? <div className="irve-sidepanel__backdrop" onClick={onClose} /> : null}

      <div
        className={`irve-sidepanel__content${contentClassName ? ` ${contentClassName}` : ""}`}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
      >
        <div className="irve-sidepanel__header">
          <div className="irve-sidepanel__header-copy">
            {eyebrow ? <p className="irve-sidepanel__eyebrow">{eyebrow}</p> : null}
            <h2 id={titleId}>{title}</h2>
            {subtitle ? <p className="irve-sidepanel__subtitle">{subtitle}</p> : null}
          </div>

          <Button
            priority="tertiary"
            iconId="fr-icon-close-line"
            title="Fermer le panneau"
            onClick={onClose}
          />
        </div>

        <div className={`irve-sidepanel__body${bodyClassName ? ` ${bodyClassName}` : ""}`}>
          {children}
        </div>
      </div>
    </aside>
  );
}
