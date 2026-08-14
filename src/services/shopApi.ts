import { DEFAULT_SHOPS } from '../constants/options';
import { Shop } from '../types';

const OSM_QUERY = `
  [out:json][timeout:25];
  (
    node["shop"~"^(supermarket|greengrocer|butcher|fishmonger|general)$"](around:2000,{{lat}},{{lng}});
    way["shop"~"^(supermarket|greengrocer|butcher|fishmonger|general)$"](around:2000,{{lat}},{{lng}});
  );
  out center;
`;

const typeFromShopTag = (shopTag?: string): Shop['type'] => {
  if (!shopTag) {
    return 'general';
  }

  const normalized = shopTag.toLowerCase();
  if (normalized.includes('fish') || normalized.includes('seafood')) {
    return 'fishmonger';
  }
  if (normalized.includes('butcher') || normalized.includes('meat')) {
    return 'butcher';
  }
  return 'general';
};

const buildNearestShopFromList = (
  latitude: number,
  longitude: number,
  shops: Shop[],
  maxDistanceMeters: number
): Shop | null => {
  let nearest: Shop | null = null;

  for (const shop of shops) {
    const distanceInMeters = Math.sqrt(
      Math.pow(latitude - shop.latitude, 2) + Math.pow(longitude - shop.longitude, 2)
    ) * 111_000;

    if (distanceInMeters <= maxDistanceMeters && (!nearest || distanceInMeters < nearest.radiusMeters)) {
      nearest = shop;
    }
  }

  return nearest;
};

export const findNearbyShopByCoordinates = async (
  latitude: number,
  longitude: number,
  shops: Shop[] = DEFAULT_SHOPS,
  maxDistanceMeters = 200
): Promise<Shop | null> => {
  const localFallback = buildNearestShopFromList(latitude, longitude, shops, maxDistanceMeters);
  if (localFallback) {
    return localFallback;
  }

  try {
    const query = OSM_QUERY.replace('{{lat}}', latitude.toString()).replace('{{lng}}', longitude.toString());
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      return localFallback;
    }

    const data = await response.json();
    const element = data?.elements?.find((item: any) => item?.tags?.shop)?.tags ?? null;

    if (!element) {
      return localFallback;
    }

    const tagType = element.shop ?? 'general';
    const shopName = element.name ?? 'Nearby shop';

    return {
      id: `osm-${Date.now()}`,
      name: shopName,
      type: typeFromShopTag(tagType),
      latitude,
      longitude,
      radiusMeters: maxDistanceMeters,
    };
  } catch (error) {
    console.warn('Fallback shop lookup used instead of Overpass result.', error);
    return localFallback;
  }
};
