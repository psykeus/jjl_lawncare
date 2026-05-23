"use client";

/* eslint-disable @next/next/no-img-element, @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export type AdminMapJob = {
  id: string;
  status: string;
  scheduledDate: string | null;
  scheduledStartTime: string | null;
  customerName: string;
  customerPhone: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  serviceName: string | null;
  requestedWork: string | null;
  scopeIncluded: string | null;
  preferredDates: string | null;
  yardSize: string | null;
  grassHeight: string | null;
  estimateNumber: string | null;
  estimateTotal: number | null;
  photoUrls: string[];
};

type GoogleMapsRuntime = any;

declare global {
  interface Window {
    google?: GoogleMapsRuntime;
    __jjlMapsPromise?: Promise<GoogleMapsRuntime>;
  }
}

const statusColors: Record<string, string> = {
  accepted: "#2563eb",
  scheduled: "#16a34a",
  on_hold: "#f59e0b",
  on_the_way: "#7c3aed",
  in_progress: "#ea580c",
  completed: "#0891b2",
  completed_unpaid: "#dc2626",
  paid: "#15803d",
  cancelled: "#64748b",
};

function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps) return Promise.resolve(window.google);
  if (window.__jjlMapsPromise) return window.__jjlMapsPromise;

  window.__jjlMapsPromise = new Promise((resolve, reject) => {
    const callbackName = `initJjlMaps${Date.now()}`;
    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      if (window.google) resolve(window.google);
      else reject(new Error("Google Maps failed to load."));
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Google Maps script failed."));
    document.head.appendChild(script);
  });

  return window.__jjlMapsPromise;
}

function mapsDirectionsUrl(jobs: AdminMapJob[]) {
  const stops = jobs.filter((job) => job.latitude && job.longitude).map((job) => `${job.latitude},${job.longitude}`);
  if (!stops.length) return "https://www.google.com/maps";
  if (stops.length === 1) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stops[0])}`;
  return `https://www.google.com/maps/dir/${stops.map(encodeURIComponent).join("/")}`;
}

function markerContent(job: AdminMapJob) {
  const photo = job.photoUrls[0] ? `<img src="${job.photoUrls[0]}" alt="Request photo" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-top:8px" />` : "";
  return `
    <div style="max-width:280px;font-family:Inter,system-ui,sans-serif">
      <strong>${job.customerName}</strong><br />
      <span>${job.address}, ${job.city}</span><br />
      <span>Status: ${job.status.replaceAll("_", " ")}</span><br />
      <span>Work: ${(job.serviceName ?? job.scopeIncluded ?? job.requestedWork ?? "Job").slice(0, 100)}</span>
      ${photo}
      <div style="margin-top:8px"><a href="/admin/jobs/${job.id}">Open job</a></div>
    </div>
  `;
}

export function AdminJobMap({ jobs, apiKey }: { jobs: AdminMapJob[]; apiKey?: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<GoogleMapsRuntime | null>(null);
  const directionsRendererRef = useRef<GoogleMapsRuntime | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(jobs[0]?.id ?? null);
  const [mapError, setMapError] = useState<string | null>(null);

  const routableJobs = useMemo(
    () => jobs.filter((job) => job.latitude && job.longitude).sort((a, b) => `${a.scheduledDate ?? "9999"} ${a.scheduledStartTime ?? ""}`.localeCompare(`${b.scheduledDate ?? "9999"} ${b.scheduledStartTime ?? ""}`)),
    [jobs],
  );
  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? jobs[0] ?? null;

  useEffect(() => {
    if (!apiKey || !mapRef.current || !routableJobs.length) return;
    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then((googleMaps) => {
        if (cancelled || !mapRef.current) return;
        const center = { lat: Number(routableJobs[0].latitude), lng: Number(routableJobs[0].longitude) };
        const map = new googleMaps.maps.Map(mapRef.current, {
          center,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        mapInstanceRef.current = map;
        directionsRendererRef.current = new googleMaps.maps.DirectionsRenderer({ suppressMarkers: false, preserveViewport: false });
        directionsRendererRef.current.setMap(map);

        const bounds = new googleMaps.maps.LatLngBounds();
        const infoWindow = new googleMaps.maps.InfoWindow();
        routableJobs.forEach((job, index) => {
          const position = { lat: Number(job.latitude), lng: Number(job.longitude) };
          bounds.extend(position);
          const marker = new googleMaps.maps.Marker({
            position,
            map,
            title: `${index + 1}. ${job.customerName}`,
            label: String(index + 1),
            icon: {
              path: googleMaps.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: statusColors[job.status] ?? "#2563eb",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
          marker.addListener("click", () => {
            setSelectedJobId(job.id);
            infoWindow.setContent(markerContent(job));
            infoWindow.open({ map, anchor: marker });
          });
        });
        if (routableJobs.length > 1) map.fitBounds(bounds, 64);
      })
      .catch((error: Error) => setMapError(error.message));

    return () => {
      cancelled = true;
    };
  }, [apiKey, routableJobs]);

  function buildRoute() {
    if (!window.google?.maps || !directionsRendererRef.current || routableJobs.length < 2) return;
    const routeStops = routableJobs.slice(0, 10);
    const origin = routeStops[0];
    const destination = routeStops[routeStops.length - 1];
    const waypoints = routeStops.slice(1, -1).map((job) => ({ location: { lat: Number(job.latitude), lng: Number(job.longitude) }, stopover: true }));
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route({
      origin: { lat: Number(origin.latitude), lng: Number(origin.longitude) },
      destination: { lat: Number(destination.latitude), lng: Number(destination.longitude) },
      waypoints,
      optimizeWaypoints: true,
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result: GoogleMapsRuntime, status: string) => {
      if (status === "OK" && result) directionsRendererRef.current?.setDirections(result);
      else setMapError(`Could not build route: ${status}`);
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card className="p-0">
        {apiKey && routableJobs.length ? (
          <div ref={mapRef} className="h-[640px] w-full rounded-2xl" />
        ) : (
          <div className="flex h-[480px] items-center justify-center rounded-2xl bg-[var(--muted)] p-8 text-center text-sm text-[var(--muted-foreground)]">
            {routableJobs.length ? "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the embedded map." : "No jobs have latitude/longitude yet. Geocoding runs when addresses are created."}
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <Card>
          <h2 className="text-xl font-bold">Route planning</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Pins are ordered by scheduled date/time. Build an optimized route for up to the first 10 mapped jobs, or open all stops in Google Maps.</p>
          {mapError ? <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]">{mapError}</div> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={buildRoute} disabled={!apiKey || routableJobs.length < 2}>Pinpoint route</Button>
            <a className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] bg-white px-4 font-semibold hover:bg-[var(--muted)]" href={mapsDirectionsUrl(routableJobs)} target="_blank" rel="noreferrer">Open in Google Maps</a>
          </div>
        </Card>

        {selectedJob ? (
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{selectedJob.customerName}</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{selectedJob.address}, {selectedJob.city}, {selectedJob.state} {selectedJob.zip}</p>
              </div>
              <StatusBadge status={selectedJob.status} />
            </div>
            <dl className="mt-4 grid gap-2 text-sm">
              <div><dt className="font-semibold">Scheduled</dt><dd>{formatDate(selectedJob.scheduledDate)} {selectedJob.scheduledStartTime ?? ""}</dd></div>
              <div><dt className="font-semibold">Requested work</dt><dd className="whitespace-pre-wrap text-[var(--muted-foreground)]">{selectedJob.serviceName ?? "Service"}: {selectedJob.requestedWork ?? selectedJob.scopeIncluded ?? "No request notes."}</dd></div>
              <div><dt className="font-semibold">Yard</dt><dd>{selectedJob.yardSize ?? "—"} · Grass: {selectedJob.grassHeight ?? "—"}</dd></div>
              <div><dt className="font-semibold">Preferred dates</dt><dd>{selectedJob.preferredDates ?? "—"}</dd></div>
            </dl>
            {selectedJob.photoUrls.length ? (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {selectedJob.photoUrls.slice(0, 6).map((url) => <a key={url} href={url} target="_blank" rel="noreferrer"><img src={url} alt="Request upload" className="h-20 w-full rounded-lg object-cover" /></a>)}
              </div>
            ) : <p className="mt-4 text-sm text-[var(--muted-foreground)]">No request photos attached.</p>}
            <div className="mt-4 flex gap-2">
              <Link className="text-sm font-semibold text-[var(--primary)]" href={`/admin/jobs/${selectedJob.id}`}>Open job</Link>
              <a className="text-sm font-semibold text-[var(--primary)]" href={`https://www.google.com/maps/search/?api=1&query=${selectedJob.latitude},${selectedJob.longitude}`} target="_blank" rel="noreferrer">Directions</a>
            </div>
          </Card>
        ) : null}

        <Card className="max-h-[520px] overflow-auto p-0">
          <div className="sticky top-0 border-b border-[var(--border)] bg-white p-4"><h2 className="font-bold">Mapped jobs</h2></div>
          <div className="divide-y divide-[var(--border)]">
            {routableJobs.map((job, index) => (
              <button key={job.id} type="button" onClick={() => setSelectedJobId(job.id)} className="block w-full p-4 text-left hover:bg-[var(--muted)]">
                <div className="flex items-start justify-between gap-3"><span className="font-semibold">{index + 1}. {job.customerName}</span><StatusBadge status={job.status} /></div>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{job.address}, {job.city}</p>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">{job.serviceName ?? "Work"}: {job.requestedWork ?? job.scopeIncluded ?? "No notes"}</p>
              </button>
            ))}
            {routableJobs.length ? null : <div className="p-4 text-sm text-[var(--muted-foreground)]">No mapped jobs yet.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
