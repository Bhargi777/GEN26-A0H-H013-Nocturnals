"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { CalendarEvent } from "@/lib/types/campus";

const CAMPUS = { latitude: 10.9036046, longitude: 76.899696, radiusMeters: 1000 };

const LeafletMap = dynamic(() => import("./leaflet-event-map"), { ssr: false, loading: () => <div className="h-80 rounded-card border bg-background p-4 text-secondary">Loading campus map…</div> });

function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const earth = 6_371_000;
  const lat = (b.latitude - a.latitude) * Math.PI / 180;
  const lon = (b.longitude - a.longitude) * Math.PI / 180;
  const h = Math.sin(lat / 2) ** 2 + Math.cos(a.latitude * Math.PI / 180) * Math.cos(b.latitude * Math.PI / 180) * Math.sin(lon / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(h));
}

export function EventMap({ events }: { events: CalendarEvent[] }) {
  const [position, setPosition] = useState<{ latitude: number; longitude: number }>();
  const [locationError, setLocationError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const insideCampus = position ? distanceMeters(position, CAMPUS) <= CAMPUS.radiusMeters : undefined;

  function locate() {
    if (!navigator.geolocation) { setLocationError("Location is not available in this browser."); return; }
    setBusy(true); setLocationError(undefined);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setPosition({ latitude: coords.latitude, longitude: coords.longitude }); setBusy(false); },
      () => { setLocationError("Location permission was not granted. You can still view the event map."); setBusy(false); },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return <section className="space-y-3" aria-labelledby="event-map-heading">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 id="event-map-heading">Event locations</h3><p className="text-secondary">See each venue on the Amrita Coimbatore campus map.</p></div>
      <button type="button" onClick={locate} disabled={busy} className="rounded-control border bg-surface px-3 py-2 text-sm font-medium text-accent hover:bg-background">{busy ? "Finding you…" : "Use my location"}</button>
    </div>
    {position && <p className={insideCampus ? "text-status-green-dark" : "text-status-amber-dark"}>{insideCampus ? "You are within the campus geofence." : "You appear to be outside the campus geofence."} Use the directions link on an event marker to navigate.</p>}
    {locationError && <p role="status" className="text-status-amber-dark">{locationError}</p>}
    <LeafletMap events={events} position={position} campus={CAMPUS} />
  </section>;
}
