/**
 * Price utilities
 * All prices are stored in CENTS in the database
 * Example: 50.00€ = 5000 cents
 */

/**
 * Convert cents to display currency (€)
 * @param cents Price in cents
 * @returns Formatted price string
 */
export function formatPrice(cents: number, locale: string = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Convert euros to cents (for API/DB storage)
 * @param euros Price in euros
 * @returns Price in cents
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/**
 * Convert cents to euros
 * @param cents Price in cents
 * @returns Price in euros
 */
export function centsToEuros(cents: number): number {
  return cents / 100;
}

/**
 * Apply discount to price in cents
 * @param priceCents Original price in cents
 * @param discountPercent Discount percentage (0-100)
 * @returns Discounted price in cents
 */
export function applyDiscount(priceCents: number, discountPercent: number): number {
  return Math.round(priceCents * (1 - discountPercent / 100));
}

/**
 * Calculate shipping cost based on subtotal
 * Free shipping over 150€
 * Otherwise 9.90€
 */
export function calculateShipping(subtotalCents: number): number {
  const SHIPPING_THRESHOLD = 15000; // 150.00€ in cents
  const SHIPPING_COST = 990; // 9.90€ in cents

  return subtotalCents >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
}
