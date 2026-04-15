/**
 * MakeHuman2 Pattern Index
 * ========================
 *
 * Central hub for all UI component patterns.
 *
 * Architecture mirrors ropods-website and ropods-store:
 *   - Each concern lives in its own file (panel.ts, buttons.ts, etc.)
 *   - This index assembles the master `patterns` object for legacy imports
 *   - Individual chunk exports are also available for tree-shaking
 *
 * Usage:
 *   // Recommended (named chunk):
 *   import { panelPatterns } from '@/lib/patterns';
 *   <div className={panelPatterns.container}>
 *
 *   // Legacy (flat object — fully backward compatible):
 *   import { patterns } from '@/lib/patterns';
 *   <div className={patterns.panel.container}>
 */

import { typographyPatterns } from './typography';
import { controlPatterns } from './controls';
import { buttonPatterns } from './buttons';
import { panelPatterns } from './panel';
import { toolbarPatterns, menuBarPatterns } from './toolbar';
import { modellingPatterns } from './modelling';
import { assetPatterns } from './assets';
import { skeletonPatterns } from './skeleton';
import { viewportPatterns } from './viewport';
import { exportPatterns } from './export';
import { statusBarPatterns } from './status';

// ---------------------------------------------------------------------------
// Master patterns object (backward-compatible with existing components)
// ---------------------------------------------------------------------------
export const patterns = {
  // --- Layout & Panels (maps existing panel.* keys) ---
  panel: {
    container:    panelPatterns.container,
    titleBar:     panelPatterns.titleBar,
    titleText:    panelPatterns.titleText,
    titleTextAlt: panelPatterns.titleTextAlt,
    content:      panelPatterns.content,
  },

  // --- Typography (maps existing text.* keys) ---
  text: {
    label:   typographyPatterns.label,
    muted:   typographyPatterns.muted,
    mono:    typographyPatterns.mono,
    error:   typographyPatterns.error,
    success: typographyPatterns.success,
  },

  // --- Form Controls (maps existing input.* keys) ---
  input: {
    base:          controlPatterns.input.base,
    searchWrapper: controlPatterns.input.searchWrapper,
    searchIcon:    controlPatterns.input.searchIcon,
    searchInput:   controlPatterns.input.searchInput,
    select:        controlPatterns.select.base,
    range:         controlPatterns.range.base,
  },

  // --- Buttons (maps existing button.* keys) ---
  button: {
    base:             `${buttonPatterns.base} ${buttonPatterns.size.sm}`,
    primary:          buttonPatterns.primary,
    secondary:        buttonPatterns.secondary,
    danger:           buttonPatterns.danger,
    activeCategory:   buttonPatterns.category.active,
    inactiveCategory: buttonPatterns.category.inactive,
    iconTiny:         buttonPatterns.icon.tiny,
    actionSmall:      buttonPatterns.actionSmall,
  },

  // --- Lists & Grids (maps existing grid.* keys) ---
  grid: {
    base:         assetPatterns.grid.base,
    item:         assetPatterns.grid.item.base,
    itemActive:   assetPatterns.grid.item.active,
    itemHighlight: assetPatterns.grid.item.highlight,
    itemInactive: assetPatterns.grid.item.inactive,
  },

  // --- New top-level namespaces (not in legacy API) ---
  toolbar:    toolbarPatterns,
  menuBar:    menuBarPatterns,
  modelling:  modellingPatterns,
  assets:     assetPatterns,
  skeleton:   skeletonPatterns,
  viewport:   viewportPatterns,
  export:     exportPatterns,
  statusBar:  statusBarPatterns,
  typography: typographyPatterns,
  controls:   controlPatterns,
  buttons:    buttonPatterns,
  panels:     panelPatterns,
} as const;

export default patterns;

// ---------------------------------------------------------------------------
// Named chunk exports (preferred for new code — tree-shakeable)
// ---------------------------------------------------------------------------
export {
  typographyPatterns,
  controlPatterns,
  buttonPatterns,
  panelPatterns,
  toolbarPatterns,
  menuBarPatterns,
  modellingPatterns,
  assetPatterns,
  skeletonPatterns,
  viewportPatterns,
  exportPatterns,
  statusBarPatterns,
};
