"use client";

/**
 * Mode-2 (Equipment) Panel – shared template for all 8 equipment types.
 * Mirrors ImageSelection.leftPanel() + drawImageSelector() from MHMainWindow.
 *
 * Equipment types (category_buttons[2]):
 *   0 clothes | 1 hair | 2 eyes | 3 eyebrows | 4 eyelashes
 *   5 teeth   | 6 tongue | 7 proxy (topology)
 */

import { typographyPatterns, controlPatterns, buttonPatterns } from "@/lib/patterns";
import { Search, RefreshCw, Trash2, Info, Plus } from "lucide-react";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className={typographyPatterns.label}>
      {children}
    </label>
  );
}

export interface EquipmentItem {
  name: string;
  uuid?: string;
  author?: string;
  tag?: string;
  equipped?: boolean;
}

export function EquipmentPanel({
  equipType,
  filter,
  onFilterChange,
  items,
  selectedItem,
  onSelectItem,
  onUse,
  onRemove,
  onInfo,
  onRefresh,
  multiSelect,
}: {
  equipType: string;
  filter: string;
  onFilterChange: (v: string) => void;
  items: EquipmentItem[];
  selectedItem: string;
  onSelectItem: (name: string) => void;
  onUse: (name: string) => void;
  onRemove: (name: string) => void;
  onInfo: (name: string) => void;
  onRefresh: () => void;
  multiSelect?: boolean;
}) {
  const filtered = items.filter(
    (i) =>
      !filter ||
      i.name.toLowerCase().includes(filter.toLowerCase()) ||
      (i.tag && i.tag.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Filter */}
      <div className="flex flex-col gap-1">
        <FieldLabel>Filter {equipType}</FieldLabel>
        <div className="flex gap-1">
          <div className={`${controlPatterns.input.searchWrapper} flex-1`}>
            <Search className={controlPatterns.input.searchIcon} />
            <input
              type="text"
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
              placeholder={`filter ${equipType}…`}
              className={controlPatterns.input.searchInput}
            />
          </div>
          <button
            onClick={onRefresh}
            title="Refresh"
            className={buttonPatterns.refreshAddon}
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Item list */}
      <div className="rounded border border-white/[0.06] bg-black/20 overflow-hidden max-h-44 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-zinc-600 italic">
              {items.length === 0
                ? `No ${equipType} loaded. Connect to browse assets.`
                : `No ${equipType} match the filter.`}
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <button
              key={item.name}
              onClick={() => onSelectItem(item.name)}
              className={`${
                selectedItem === item.name
                  ? buttonPatterns.equipItem.selected
                  : item.equipped
                  ? buttonPatterns.equipItem.equipped
                  : buttonPatterns.equipItem.base
              }`}
            >
              <span className="flex-1 truncate font-mono">{item.name}</span>
              {item.equipped && (
                <span className={buttonPatterns.equippedBadge}>on</span>
              )}
            </button>
          ))
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => selectedItem && onUse(selectedItem)}
          disabled={!selectedItem}
          className={buttonPatterns.assetUse}
        >
          <Plus className="w-3.5 h-3.5" />
          Use
        </button>
        <button
          onClick={() => selectedItem && onRemove(selectedItem)}
          disabled={!selectedItem}
          className={buttonPatterns.assetRemove}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove
        </button>
        <button
          onClick={() => selectedItem && onInfo(selectedItem)}
          disabled={!selectedItem}
          className={buttonPatterns.assetInfo}
        >
          <Info className="w-3.5 h-3.5" />
          Info
        </button>
      </div>
    </div>
  );
}
