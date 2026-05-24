export function getGoogleMapsBrowserKey() {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_MAPS_API_KEY ||
    // Some hosting dashboards are configured with a non-public name. This is still
    // exposed to the browser when used for Maps JavaScript, so prefer NEXT_PUBLIC_*.
    process.env.GOOGLE_MAPS_BROWSER_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    null
  );
}

export function getGoogleMapsServerKey() {
  return (
    process.env.GOOGLE_MAPS_SERVER_API_KEY ||
    process.env.GOOGLE_MAPS_GEOCODING_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY ||
    null
  );
}
