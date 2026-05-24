import { getGoogleMapsServerKey } from "./config";

export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  const key = getGoogleMapsServerKey();
  if (!key) return null;

  const params = new URLSearchParams({ address, key });
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`, {
    next: { revalidate: 60 * 60 * 24 * 30 },
  });

  if (!response.ok) return null;
  const payload = await response.json();
  const location = payload.results?.[0]?.geometry?.location;
  if (!location) return null;

  return { latitude: location.lat, longitude: location.lng };
}
