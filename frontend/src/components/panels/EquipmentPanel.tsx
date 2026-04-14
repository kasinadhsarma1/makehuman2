"use client";

/**
 * Mode-2 (Equipment) Panel – shared template for all 8 equipment types.
 * Mirrors ImageSelection.leftPanel() + drawImageSelector() from MHMainWindow.
 *
 * Equipment types (category_buttons[2]):
 *   0 clothes | 1 hair | 2 eyes | 3 eyebrows | 4 eyelashes
 *   5 teeth   | 6 tongue | 7 proxy (topology)
 */

import patterns from "@/lib/patterns";
import { Search, RefreshCw, Trash2, Info, Plus } from "lucide-react";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className={patterns.text.label}>
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
      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
        Character equipment :: filter
      </p>

      {/* Filter */}
      <div className="flex flex-col gap-1">
        <FieldLabel>Filter {equipType}</FieldLabel>
        <div className={`${patterns.input.searchWrapper} flex gap-1`}>
          <div className={`${patterns.input.searchWrapper} flex-1`}>
            <Search className={patterns.input.searchIcon} />
            <input
              type="text"
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
              placeholder={`filter ${equipType}…`}
              className={`w-full bg-white/[0.04] border border-white/[0.08] rounded pl-7 pr-2 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:${patterns.grid.itemHighlight}`}
            />
          </div>
          <button
            onClick={onRefresh}
            title="Refresh"
            className="px-2 py-1.5 rounded bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
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
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                selectedItem === item.name
                  ? "bg-orange-600/50 text-white"
                  : item.equipped
                  ? "bg-violet-900/30 text-violet-200 hover:bg-violet-900/40"
                  : "text-zinc-300 hover:bg-white/[0.04]"
              }`}
            >
              <span className="flex-1 truncate font-mono">{item.name}</span>
              {item.equipped && (
                <span className="text-[9px] bg-violet-700/50 text-violet-300 px-1.5 py-0.5 rounded-full shrink-0">
                  on
                </span>
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold transition-colors disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" />
          Use
        </button>
        <button
          onClick={() => selectedItem && onRemove(selectedItem)}
          disabled={!selectedItem}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-900/30 hover:bg-red-800/50 border border-red-700/30 text-red-300 text-xs font-semibold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove
        </button>
        <button
          onClick={() => selectedItem && onInfo(selectedItem)}
          disabled={!selectedItem}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-xs font-semibold transition-colors disabled:opacity-40"
        >
          <Info className="w-3.5 h-3.5" />
          Info
        </button>
      </div>
    </div>
  );
}
