"use client";

import "leaflet/dist/leaflet.css";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { CalendarEvent } from "@/lib/types/campus";

type Point = { latitude: number; longitude: number };

export default function LeafletEventMap({ events, position, campus }: { events: CalendarEvent[]; position?: Point; campus: Point & { radiusMeters: number } }) {
  const mapped = events.filter((event) => event.hall_latitude != null && event.hall_longitude != null);
  return <MapContainer center={[campus.latitude, campus.longitude]} zoom={17} scrollWheelZoom className="h-80 rounded-card border">
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <Circle center={[campus.latitude, campus.longitude]} radius={campus.radiusMeters} pathOptions={{ color: "#A9244A", fillOpacity: 0.05 }} />
    {position && <CircleMarker center={[position.latitude, position.longitude]} pathOptions={{ color: "#2563EB", fillColor: "#2563EB", fillOpacity: 1 }} radius={8}><Popup>Your location</Popup></CircleMarker>}
    {mapped.map((event) => <CircleMarker key={event.id} center={[event.hall_latitude as number, event.hall_longitude as number]} pathOptions={{ color: "#A9244A", fillColor: "#FBEAF0", fillOpacity: 1 }} radius={10}>
      <Popup><strong>{event.title}</strong><br />{event.hall_name}<br /><a href={`https://www.google.com/maps/dir/?api=1&destination=${event.hall_latitude},${event.hall_longitude}`} target="_blank" rel="noreferrer">Get directions</a></Popup>
    </CircleMarker>)}
  </MapContainer>;
}
