import React from 'react';
import { X, ShoppingCart, Sparkles } from 'lucide-react';
import { ShopItem, Unlocks } from '../types';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  credits: number;
  unlocks: Unlocks;
  onPurchase: (category: keyof Unlocks, itemId: string, cost: number) => boolean;
}

const SHOP_ITEMS: ShopItem[] = [
  // Ball skins
  { id: 'blue', category: 'ballSkins', label: 'Azure Ball', cost: 200, hex: '#3b82f6' },
  { id: 'green', category: 'ballSkins', label: 'Emerald Ball', cost: 200, hex: '#10b981' },
  { id: 'red', category: 'ballSkins', label: 'Crimson Ball', cost: 200, hex: '#ef4444' },
  { id: 'purple', category: 'ballSkins', label: 'Violet Ball', cost: 200, hex: '#a855f7' },
  { id: 'pink', category: 'ballSkins', label: 'Neon Pink Ball', cost: 200, hex: '#ec4899' },
  // Trail colors
  { id: 'blue', category: 'trailColors', label: 'Cyan Trail', cost: 100, hex: '#22d3ee' },
  { id: 'green', category: 'trailColors', label: 'Lime Trail', cost: 100, hex: '#84cc16' },
  { id: 'red', category: 'trailColors', label: 'Magma Trail', cost: 100, hex: '#f97316' },
  { id: 'purple', category: 'trailColors', label: 'Cosmic Trail', cost: 100, hex: '#c084fc' },
  { id: 'white', category: 'trailColors', label: 'Ghost Trail', cost: 100, hex: '#e2e8f0' },
  // Bumper themes
  { id: 'dotted', category: 'bumperThemes', label: 'Dotted Bumpers', cost: 300 },
  { id: 'dashed', category: 'bumperThemes', label: 'Dashed Bumpers', cost: 300 },
  { id: 'neon', category: 'bumperThemes', label: 'Neon Bumpers', cost: 300 },
  // Map backgrounds
  { id: 'grid', category: 'mapBackgrounds', label: 'Tech Grid', cost: 150 },
  { id: 'hex', category: 'mapBackgrounds', label: 'Hex Pattern', cost: 150 },
  { id: 'blank', category: 'mapBackgrounds', label: 'Clean Slate', cost: 150 },
];

const CATEGORY_LABELS: Record<string, string> = {
  ballSkins: 'Ball Skins',
  trailColors: 'Trail Colors',
  bumperThemes: 'Bumper Themes',
  mapBackgrounds: 'Map Backgrounds',
};

const CATEGORY_COLORS: Record<string, string> = {
  ballSkins: 'border-blue-500/30 text-blue-400',
  trailColors: 'border-cyan-500/30 text-cyan-400',
  bumperThemes: 'border-fuchsia-500/30 text-fuchsia-400',
  mapBackgrounds: 'border-amber-500/30 text-amber-400',
};

export function ShopModal({ isOpen, onClose, credits, unlocks, onPurchase }: ShopModalProps) {
  if (!isOpen) return null;

  const categories = ['ballSkins', 'trailColors', 'bumperThemes', 'mapBackgrounds'] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-950 border border-emerald-500/30 rounded-2xl shadow-2xl p-6 text-neutral-200">
        <button
          onClick={onClose}
          className="absolute p-2 text-neutral-400 transition-colors top-4 right-4 hover:text-white hover:bg-neutral-900 rounded-lg"
          aria-label="Close shop"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 border-b border-emerald-500/20 pb-4">
          <ShoppingCart className="w-7 h-7 text-emerald-400" />
          <h2 className="text-2xl font-bold tracking-widest text-emerald-400 font-sans uppercase">CYBERNETIC SHOP</h2>
        </div>

        {/* Credit balance */}
        <div className="mb-4 px-4 py-2 bg-amber-950/20 border border-amber-500/20 rounded-lg flex items-center justify-between">
          <span className="text-xs font-mono tracking-wider text-amber-400 uppercase font-bold">Cybernetic Credits</span>
          <span className="text-lg font-black text-amber-300 font-mono">{credits} CC</span>
        </div>

        {/* Shop items by category */}
        <div className="space-y-4">
          {categories.map(cat => {
            const items = SHOP_ITEMS.filter(i => i.category === cat);
            return (
              <div key={cat}>
                <h3 className={`text-xs font-mono tracking-widest uppercase font-bold mb-2 px-1 ${CATEGORY_COLORS[cat]}`}>
                  {CATEGORY_LABELS[cat]}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {items.map(item => {
                    const owned = unlocks[item.category]?.[item.id] === true;
                    const affordable = credits >= item.cost;
                    return (
                      <button
                        key={`${item.category}-${item.id}`}
                        disabled={owned}
                        onClick={() => onPurchase(item.category, item.id, item.cost)}
                        className={`p-3 rounded-xl border text-left text-xs transition-all ${
                          owned
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 cursor-default'
                            : affordable
                              ? 'bg-neutral-900 border-amber-500/20 hover:border-amber-400/40 hover:bg-neutral-800 cursor-pointer text-neutral-300'
                              : 'bg-neutral-900/50 border-neutral-800 text-neutral-600 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {item.hex && (
                            <span
                              className="w-4 h-4 rounded-full border border-white/10 shrink-0"
                              style={{ backgroundColor: item.hex }}
                            />
                          )}
                          <span className="font-semibold">{item.label}</span>
                        </div>
                        {owned ? (
                          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> OWNED
                          </span>
                        ) : (
                          <span className={`text-[10px] font-mono ${affordable ? 'text-amber-400' : 'text-red-400'}`}>
                            {item.cost} CC
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-emerald-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold tracking-wider text-xs uppercase rounded transition-colors cursor-pointer"
          >
            CLOSE SHOP
          </button>
        </div>
      </div>
    </div>
  );
}
