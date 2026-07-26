import type { ComponentType } from 'react';
import type { ModuleKey } from '@/types';

/*
 * core/page-builder — the drag/toggle/expand machinery, with no idea what a
 * module contains.
 *
 * A fork registers its own modules and inherits the whole page builder. See
 * docs/ROADMAP.md — Part 2, seam 2.
 *
 * `ModuleKey` still comes from @/types because the enabled/order/expanded maps
 * are typed by it; when core/ becomes its own package it becomes a parameter.
 */

export interface ModuleDefinition {
  key: ModuleKey;
  /** Shown in the module list, and used to name this card's controls. */
  label: string;
  /** Swatch beside the label during onboarding. */
  accent: string;
  /** Renders the card. Reads whatever it needs from the store itself. */
  Component: ComponentType;
}

export interface ModuleRegistry {
  all: ModuleDefinition[];
  byKey: (key: ModuleKey) => ModuleDefinition | undefined;
  /**
   * The modules to render: enabled only, in the user's saved order.
   *
   * Order is applied to the markup rather than to CSS `order`, so the DOM,
   * the tab sequence and the screen reader all agree with what is on screen.
   */
  visible: (order: ModuleKey[], enabled: Record<ModuleKey, boolean>) => ModuleDefinition[];
}

export function createModuleRegistry(definitions: ModuleDefinition[]): ModuleRegistry {
  const byKey = (key: ModuleKey) => definitions.find((d) => d.key === key);
  return {
    all: definitions,
    byKey,
    visible: (order, enabled) =>
      order.flatMap((key) => {
        const definition = byKey(key);
        return definition && enabled[key] ? [definition] : [];
      }),
  };
}
