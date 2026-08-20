import { Category, Ingredient } from '../types';

const OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/api/v2/product';

export interface BarcodeScanSuggestion extends Partial<Ingredient> {
  name: string;
}

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

  let response: Response;
  try {
    response = await fetch(`${OPEN_FOOD_FACTS_URL}/${normalizedBarcode}.json`);
  } catch (error) {
    console.warn('Network error while fetching barcode product', error);
    throw new BarcodeFetchError('Network request failed while looking up the barcode.');
  }

  if (!response.ok) {
    throw new BarcodeFetchError(`OpenFoodFacts responded with status ${response.status}.`);
  }

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

  if (!payload.product || payload.status !== 1) {
    return null;
  }

  const productName = safeText(payload.product.product_name);
  const brand = safeText(payload.product.brands);
  const category = toCategory(safeText(payload.product.categories));

  if (!productName) {
    return null;
  }

  return {
    name: productName,
    brand: brand ?? undefined,
    category,
  };
};