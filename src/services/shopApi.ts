import { Shop, ShopType } from '../types';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const SEARCH_RADIUS_METERS = 500;

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    shop?: string;
  };
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

const shopTypeFromTag = (shopTag?: string): ShopType | null => {
  if (shopTag === 'butcher') {
    return 'butcher';
  }

  if (shopTag === 'seafood' || shopTag === 'fishmonger') {
    return 'fishmonger';
  }

  if (shopTag === 'greengrocer')  {
    return 'greengrocer';
  }

  if (shopTag === 'bakery') {
    return 'bakery';
  }

  if (
    shopTag === 'supermarket' ||
    shopTag === 'convenience'
  ) {
    return 'general';
  }

  return null;
};

const overpassQuery = (latitude: number, longitude: number): string => {
  return `
    [out:json][timeout:8];
    (
      node["shop"~"supermarket|convenience|butcher|seafood|fishmonger|greengrocer|bakery"]
        (around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
      way["shop"~"supermarket|convenience|butcher|seafood|fishmonger|greengrocer|bakery"]
        (around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
    );
    out center;
  `;
};

const elementToShop = (element: OverpassElement): Shop | null => {
  const shopType = shopTypeFromTag(element.tags?.shop);

  if (!shopType) {
    return null;
  }

  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;

  if (latitude === undefined || longitude === undefined) {
    return null;
  }

  return {
    id: `osm-${element.id}`,
    name: element.tags?.name ?? 'Nearby Store',
    type: shopType,
    latitude,
    longitude,
    radiusMeters: SEARCH_RADIUS_METERS,
  };
};

export const fetchNearbyShops = async (
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<Shop[]> => {

  const body = overpassQuery(latitude, longitude);

  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `data=${encodeURIComponent(body)}`,
    signal,
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as OverpassResponse;

  return (data.elements ?? [])
    .map(elementToShop)
    .filter((shop): shop is Shop => shop !== null);
};
