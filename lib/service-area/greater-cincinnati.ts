export const GREATER_CINCINNATI_BOUNDS = {
  // Broad Greater Cincinnati / Northern Kentucky / nearby surrounding area.
  north: 39.55,
  south: 38.75,
  east: -83.75,
  west: -85.05,
};

export const GREATER_CINCINNATI_CITIES = [
  "cincinnati",
  "norwood",
  "blue ash",
  "mason",
  "loveland",
  "milford",
  "madeira",
  "indian hill",
  "mariemont",
  "anderson",
  "west chester",
  "fairfield",
  "covington",
  "newport",
];

export function isInGreaterCincinnati(latitude: number | null | undefined, longitude: number | null | undefined) {
  if (latitude == null || longitude == null) return false;
  return (
    latitude >= GREATER_CINCINNATI_BOUNDS.south &&
    latitude <= GREATER_CINCINNATI_BOUNDS.north &&
    longitude >= GREATER_CINCINNATI_BOUNDS.west &&
    longitude <= GREATER_CINCINNATI_BOUNDS.east
  );
}
