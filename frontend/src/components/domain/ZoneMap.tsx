// The one place the console needs a real map. Zone boundaries are polygons in
// world coordinates; nothing hand-rolled would let an admin see whether a zone
// covers the streets they mean.
//
// Leaflet is driven imperatively here rather than through a React wrapper — the
// wrapper would be a second dependency for no gain, and the map is the only
// mutable DOM the console keeps outside React.

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DeliveryZone } from '../../data/types';
import { CAMEROON_CENTRE } from '../../data/zoneSeed';

interface ZoneMapProps {
  zones: DeliveryZone[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Points collected so far while drawing. `null` means not drawing. */
  draft: [number, number][] | null;
  onAddPoint: (point: [number, number]) => void;
  height?: number;
}

/** Reads a design token, so no colour is hard-coded outside tokens.css. */
function token(el: HTMLElement, name: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

export default function ZoneMap({
  zones, selectedId, onSelect, draft, onAddPoint, height = 420,
}: ZoneMapProps) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const zoneLayer = useRef<L.LayerGroup | null>(null);
  const draftLayer = useRef<L.LayerGroup | null>(null);
  const fitted = useRef(false);

  // Click handling reads the newest props without re-binding the listener,
  // which would otherwise detach and reattach on every keystroke elsewhere.
  const latest = useRef({ draft, onAddPoint });
  useEffect(() => {
    latest.current = { draft, onAddPoint };
  }, [draft, onAddPoint]);

  useEffect(() => {
    if (!holder.current || map.current) return;

    const m = L.map(holder.current, {
      center: CAMEROON_CENTRE,
      zoom: 6,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(m);

    m.on('click', (e: L.LeafletMouseEvent) => {
      if (latest.current.draft === null) return;
      latest.current.onAddPoint([e.latlng.lat, e.latlng.lng]);
    });

    zoneLayer.current = L.layerGroup().addTo(m);
    draftLayer.current = L.layerGroup().addTo(m);
    map.current = m;

    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // Existing zones.
  useEffect(() => {
    const m = map.current;
    const layer = zoneLayer.current;
    const el = holder.current;
    if (!m || !layer || !el) return;

    layer.clearLayers();

    const emerald = token(el, '--emerald');
    const forest = token(el, '--forest-400');
    const calm = token(el, '--calm');

    for (const zone of zones) {
      if (zone.polygon.length < 3) continue;
      const selected = zone.id === selectedId;
      // An inactive zone is drawn but muted: it exists, it is just not serving.
      const colour = !zone.isActive ? calm : selected ? emerald : forest;

      const polygon = L.polygon(zone.polygon, {
        color: colour,
        weight: selected ? 3 : 2,
        opacity: zone.isActive ? 1 : 0.6,
        fillColor: colour,
        fillOpacity: selected ? 0.28 : 0.12,
        dashArray: zone.isActive ? undefined : '5 5',
      });
      polygon.bindTooltip(
        `${zone.name}${zone.isActive ? '' : ' · off'}`,
        { direction: 'center', className: 'reeyo-zone-label' },
      );
      polygon.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelect(zone.id);
      });
      polygon.addTo(layer);
    }

    // Fit once, on the first set of real polygons — refitting on every edit
    // would yank the view out from under someone drawing.
    if (!fitted.current && zones.length > 0) {
      const bounds = L.latLngBounds(zones.flatMap((z) => z.polygon));
      if (bounds.isValid()) {
        m.fitBounds(bounds, { padding: [28, 28] });
        fitted.current = true;
      }
    }
  }, [zones, selectedId, onSelect]);

  // The polygon being drawn.
  useEffect(() => {
    const layer = draftLayer.current;
    const el = holder.current;
    if (!layer || !el) return;

    layer.clearLayers();
    if (!draft || draft.length === 0) return;

    const emerald = token(el, '--emerald');

    if (draft.length >= 3) {
      L.polygon(draft, {
        color: emerald, weight: 2, dashArray: '6 4',
        fillColor: emerald, fillOpacity: 0.16,
      }).addTo(layer);
    } else if (draft.length === 2) {
      L.polyline(draft, { color: emerald, weight: 2, dashArray: '6 4' }).addTo(layer);
    }

    draft.forEach((point, i) => {
      L.circleMarker(point, {
        radius: 5, color: emerald, weight: 2,
        fillColor: emerald, fillOpacity: i === 0 ? 1 : 0.5,
      }).addTo(layer);
    });
  }, [draft]);

  return (
    <div
      ref={holder}
      className="reeyo-map"
      style={{
        height, width: '100%',
        borderRadius: 'var(--r-ctrl)',
        border: '1px solid var(--line)',
        cursor: draft === null ? 'grab' : 'crosshair',
        background: 'var(--canvas)',
      }}
    />
  );
}
