import { Category, Ingredient } from '../types';

const OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/api/v2/product';

export interface BarcodeScanSuggestion extends Partial<Ingredient> {
  name: string;
}

// A dedicated error type so callers can tell "network/parsing went wrong"
// apart from "OpenFoodFacts genuinely has no data for this barcode".
// Extending Error just gives us a distinguishable class to throw/catch.
export class BarcodeFetchError extends Error {}

const toCategory = (rawCategory?: string | null): Category | null => {
  if (!rawCategory) {
    return null;
  }

  const normalized = rawCategory.toLowerCase();

  if (normalized.includes('fruit')) {
    return 'fruit';
  }

  if (normalized.includes('vegetable') || normalized.includes('legume')) {
    return 'vegetable';
  }

  if (
    normalized.includes('milk') ||
    normalized.includes('cheese') ||
    normalized.includes('dairy')
  ) {
    return 'dairy';
  }

  if (normalized.includes('fish') || normalized.includes('seafood')) {
    return 'fish';
  }

  if (
    normalized.includes('meat') ||
    normalized.includes('beef') ||
    normalized.includes('chicken') ||
    normalized.includes('pork')
  ) {
    return 'meat';
  }

  if (
    normalized.includes('drink') ||
    normalized.includes('water') ||
    normalized.includes('juice') ||
    normalized.includes('soda')
  ) {
    return 'liquid';
  }

  return 'other';
};

const safeText = (value?: string | null): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * fetchProductByBarcode queries OpenFoodFacts and maps the returned product
 * into a safe ingredient suggestion that the form can prefill.
 */
export const fetchProductByBarcode = async (
  barcode: string
): Promise<BarcodeScanSuggestion | null> => {
  const normalizedBarcode = barcode.trim();

  if (!normalizedBarcode) {
    return null;
  }

  // STEP 1: the network call itself.
  // This can fail for reasons that have nothing to do with the barcode
  // (no internet, DNS failure, timeout) — that's a technical error, not a
  // "not found" result, so we throw instead of silently returning null.
  let response: Response;
  try {
    response = await fetch(`${OPEN_FOOD_FACTS_URL}/${normalizedBarcode}.json`);
  } catch (error) {
    console.warn('Network error while fetching barcode product', error);
    throw new BarcodeFetchError('Network request failed while looking up the barcode.');
  }

  // STEP 2: check the HTTP status.
  // A non-2xx response (500, 503, etc.) means the server itself had a
  // problem — again, a technical error, not "product not found".
  if (!response.ok) {
    throw new BarcodeFetchError(`OpenFoodFacts responded with status ${response.status}.`);
  }

  // STEP 3: parse the JSON body.
  // If OpenFoodFacts ever returns malformed JSON, .json() throws — we want
  // that to surface as a technical error too, not a false "not found".
  let payload: {
    status?: number;
    product?: {
      product_name?: string | null;
      brands?: string | null;
      categories?: string | null;
      image_front_url?: string | null;
    };
  };

  try {
    payload = await response.json();
  } catch (error) {
    console.warn('Unable to parse barcode product response', error);
    throw new BarcodeFetchError('Received an unreadable response from OpenFoodFacts.');
  }

  // STEP 4: this is the ONLY legitimate "not found" case — the request
  // and parsing both succeeded, but OpenFoodFacts has no record for this
  // barcode (status !== 1) or the product field is missing.
  if (!payload.product || payload.status !== 1) {
    return null;
  }

  // STEP 5: map the raw payload into our safe suggestion shape.
  const productName = safeText(payload.product.product_name);
  const brand = safeText(payload.product.brands);
  const category = toCategory(safeText(payload.product.categories));
  const imageUrl = safeText(payload.product.image_front_url);

  // A product without a name isn't useful to prefill the form with,
  // so we treat it the same as "not found".
  if (!productName) {
    return null;
  }

  return {
    name: productName,
    brand: brand ?? undefined,
    category,
    imageUrl: imageUrl ?? undefined,
  };
};