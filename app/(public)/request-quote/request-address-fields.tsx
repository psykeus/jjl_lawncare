"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { Field, Input } from "@/components/ui/input";

declare global {
  interface Window {
    google?: any;
    __jjlPlacesPromise?: Promise<any>;
  }
}

type CheckResult = {
  inside: boolean;
  matchedAreaName: string | null;
  message: string;
};

function loadGooglePlaces(apiKey: string) {
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (window.__jjlPlacesPromise) return window.__jjlPlacesPromise;

  window.__jjlPlacesPromise = new Promise((resolve, reject) => {
    const callbackName = `initJjlPlaces${Date.now()}`;
    const timeout = window.setTimeout(() => reject(new Error("Address autocomplete timed out.")), 12_000);
    (window as any)[callbackName] = () => {
      window.clearTimeout(timeout);
      delete (window as any)[callbackName];
      if (window.google?.maps?.places) resolve(window.google);
      else reject(new Error("Google Places loaded but the Places library was unavailable."));
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&v=weekly&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("Address autocomplete could not load."));
    };
    document.head.appendChild(script);
  });

  return window.__jjlPlacesPromise;
}

function componentValue(place: any, type: string, short = false) {
  const component = place.address_components?.find((item: any) => item.types?.includes(type));
  return component ? String(short ? component.short_name : component.long_name) : "";
}

export function RequestAddressFields({ apiKey }: { apiKey?: string | null }) {
  const addressRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(null);

  async function checkArea(lat?: number | null, lng?: number | null, city?: string, zip?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (lat != null) params.set("lat", String(lat));
      if (lng != null) params.set("lng", String(lng));
      if (city) params.set("city", city);
      if (zip) params.set("zip", zip);
      const response = await fetch(`/api/service-area/check?${params.toString()}`);
      if (response.ok) setResult(await response.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!apiKey || !addressRef.current) return;
    let cancelled = false;
    loadGooglePlaces(apiKey)
      .then((googleMaps) => {
        if (cancelled || !addressRef.current) return;
        setAutocompleteError(null);
        const autocomplete = new googleMaps.maps.places.Autocomplete(addressRef.current, {
          componentRestrictions: { country: "us" },
          fields: ["address_components", "formatted_address", "geometry"],
          types: ["address"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const streetNumber = componentValue(place, "street_number");
          const route = componentValue(place, "route");
          const city = componentValue(place, "locality") || componentValue(place, "sublocality") || componentValue(place, "postal_town");
          const state = componentValue(place, "administrative_area_level_1", true);
          const zip = componentValue(place, "postal_code", true);
          const lat = place.geometry?.location?.lat?.();
          const lng = place.geometry?.location?.lng?.();

          if (addressRef.current && (streetNumber || route)) addressRef.current.value = `${streetNumber} ${route}`.trim();
          if (cityRef.current && city) cityRef.current.value = city;
          if (stateRef.current && state) stateRef.current.value = state;
          if (zipRef.current && zip) zipRef.current.value = zip;
          if (latRef.current && lat != null) latRef.current.value = String(lat);
          if (lngRef.current && lng != null) lngRef.current.value = String(lng);
          void checkArea(lat, lng, city, zip);
        });
      })
      .catch((error: Error) => setAutocompleteError(error.message));

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  return (
    <div className="grid gap-4">
      <Field label="Address line 1" hint={apiKey ? "Start typing and select your address to check the service area." : "Address autocomplete is available after the Google Maps browser key is configured."}>
        <Input ref={addressRef} name="addressLine1" required autoComplete="street-address" />
      </Field>
      <input ref={latRef} type="hidden" name="latitude" />
      <input ref={lngRef} type="hidden" name="longitude" />
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_90px_120px]">
        <Field label="Address line 2"><Input name="addressLine2" autoComplete="address-line2" /></Field>
        <Field label="City"><Input ref={cityRef} name="city" required autoComplete="address-level2" onBlur={(event) => void checkArea(null, null, event.currentTarget.value, zipRef.current?.value)} /></Field>
        <Field label="State"><Input ref={stateRef} name="state" maxLength={2} required autoComplete="address-level1" /></Field>
        <Field label="ZIP"><Input ref={zipRef} name="zip" required autoComplete="postal-code" onBlur={(event) => void checkArea(null, null, cityRef.current?.value, event.currentTarget.value)} /></Field>
      </div>
      {loading ? <div className="rounded-lg bg-[var(--muted)] p-3 text-sm text-[var(--muted-foreground)]">Checking service area…</div> : null}
      {result ? <div className={`rounded-lg p-3 text-sm font-medium ${result.inside ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"}`}>{result.message}</div> : null}
      {autocompleteError ? <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{autocompleteError} You can still type the address manually.</div> : null}
    </div>
  );
}
