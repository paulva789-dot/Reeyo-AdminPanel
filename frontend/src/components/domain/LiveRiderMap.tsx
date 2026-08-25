// Real rider positions on a real map. Driven imperatively, the same way
// ZoneMap is, so Leaflet stays the only dependency and there is one pattern
// for map code in this codebase rather than two.

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RiderLocation } from '../../data/types';
import { CAMEROON_CENTRE } from '../../data/zoneSeed';

interface LiveRiderMapProps {
  riders: RiderLocation[];
  selectedId: string | null;
  onSelect: (riderId: string) => void;
  height?: number;
}

function token(el: HTMLElement, name: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/** A rider carrying an order reads as active; a free one is idle. */
function colourFor(rider: RiderLocation, el: HTMLElement): string {
  return rider.currentOrderId ? token(el, '--emerald') : token(el, '--calm');
}

export default function LiveRiderMap({
  riders, selectedId, onSelect, height = 420,
}: LiveRiderMapProps) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const fitted = useRef(false);

  const latest = useRef(onSelect);
  useEffect(() => { latest.current = onSelect; }, [onSelect]);

  useEffect(() => {
    if (!holder.current || map.current) return;

    const m = L.map(holder.current, {
      center: CAMEROON_CENTRE,
      zoom: 6,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(m);

    layer.current = L.layerGroup().addTo(m);
    map.current = m;

    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // Positions are replaced wholesale on every poll. With a handful of riders
  // this is cheaper and far simpler than diffing markers, and it cannot drift
  // out of step with the data the way an incremental update can.
  useEffect(() => {
    const m = map.current;
    const group = layer.current;
    const el = holder.current;
    if (!m || !group || !el) return;

    group.clearLayers();

    const usable = riders.filter(
      (r) => Number.isFinite(r.lat) && Number.isFinite(r.lng)
        && !(r.lat === 0 && r.lng === 0),
    );

    for (const rider of usable) {
      const selected = rider.riderId === selectedId;
      const colour = colourFor(rider, el);

      // The halo is what makes a moving dot readable against street detail.
      L.circleMarker([rider.lat, rider.lng], {
        radius: selected ? 18 : 13,
        color: colour,
        weight: 0,
        fillColor: colour,
        fillOpacity: 0.18,
        interactive: false,
      }).addTo(group);

      const dot = L.circleMarker([rider.lat, rider.lng], {
        radius: selected ? 8 : 6,
        color: token(el, '--on-brand'),
        weight: 2,
        fillColor: colour,
        fillOpacity: 1,
      });
      dot.bindTooltip(
        `${rider.name}${rider.currentOrderId ? ` · ${rider.currentOrderId}` : ' · free'}`,
        { direction: 'top', offset: [0, -8], className: 'reeyo-zone-label' },
      );
      dot.on('click', () => latest.current(rider.riderId));
      dot.addTo(group);
    }

    // Fit once. Refitting on every poll would drag the view around under
    // anyone who has zoomed in on a particular rider.
    if (!fitted.current && usable.length > 0) {
      const bounds = L.latLngBounds(usable.map((r) => [r.lat, r.lng] as [number, number]));
      if (bounds.isValid()) {
        m.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        fitted.current = true;
      }
    }
  }, [riders, selectedId]);

  // Selecting a rider from the list beside the map moves the map to them.
  useEffect(() => {
    const m = map.current;
    if (!m || !selectedId) return;
    const rider = riders.find((r) => r.riderId === selectedId);
    if (!rider || !Number.isFinite(rider.lat) || !Number.isFinite(rider.lng)) return;
    m.flyTo([rider.lat, rider.lng], Math.max(m.getZoom(), 14), { duration: 0.8 });
  }, [selectedId, riders]);

  return (
    <div
      ref={holder}
      className="reeyo-map"
      style={{
        height, width: '100%',
        borderRadius: 'var(--r-ctrl)',
        border: '1px solid var(--line)',
        background: 'var(--canvas)',
      }}
    />
  );
}
