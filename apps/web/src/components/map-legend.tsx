import { LAYER_COLORS, LAYER_LABELS, MAP_LAYERS, type MapLayerKey } from "@/lib/gis-layers";

interface MapLegendProps {
  counts: Record<MapLayerKey, number>;
  active: Set<MapLayerKey>;
  onToggle: (layer: MapLayerKey) => void;
}

export function MapLegend({ counts, active, onToggle }: MapLegendProps) {
  return (
    <div className="absolute bottom-4 left-4 z-10 rounded-xl border border-border bg-card p-3 shadow-lg">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Camadas
      </p>
      <div className="flex flex-col gap-1">
        {MAP_LAYERS.map((layer) => {
          const isActive = active.has(layer);
          return (
            <button
              key={layer}
              type="button"
              onClick={() => onToggle(layer)}
              aria-pressed={isActive}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                isActive
                  ? "text-card-foreground hover:bg-accent"
                  : "text-muted-foreground/50 hover:bg-accent/50"
              }`}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{
                  background: isActive ? LAYER_COLORS[layer] : "transparent",
                  border: `2px solid ${LAYER_COLORS[layer]}`,
                  opacity: isActive ? 1 : 0.5,
                }}
              />
              <span className="flex-1">{LAYER_LABELS[layer]}</span>
              <span className="tabular-nums text-xs text-muted-foreground">
                {counts[layer] ?? 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
