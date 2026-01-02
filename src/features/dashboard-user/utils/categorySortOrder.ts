/**
 * Category sort order utility
 *
 * Priority:
 * - Singles > Doubles
 * - Male > Female > Mixed > Open
 *
 * Final order: Men's Singles, Women's Singles, Men's Doubles, Women's Doubles, Mixed Doubles, Open Singles, Open Doubles
 */

const CATEGORY_ORDER: Record<string, number> = {
  // Men's Singles - priority 1
  "men's singles": 1,
  "mens singles": 1,
  "men singles": 1,
  // Women's Singles - priority 2
  "women's singles": 2,
  "womens singles": 2,
  "women singles": 2,
  "ladies singles": 2,
  // Men's Doubles - priority 3
  "men's doubles": 3,
  "mens doubles": 3,
  "men doubles": 3,
  // Women's Doubles - priority 4
  "women's doubles": 4,
  "womens doubles": 4,
  "women doubles": 4,
  "ladies doubles": 4,
  // Mixed Doubles - priority 5
  "mixed doubles": 5,
  "mixed": 5,
  // Open Singles - priority 6
  "open singles": 6,
  "open": 6,
  // Open Doubles - priority 7
  "open doubles": 7,
};

/**
 * Get the sort order priority for a category name
 * @param categoryName - The category name (e.g., "Men's Singles", "Women's Doubles")
 * @returns Priority number (lower = higher priority), 999 for unknown categories
 */
export function getCategorySortOrder(categoryName: string | null): number {
  if (!categoryName) return 999;
  const normalized = categoryName.toLowerCase().trim();
  return CATEGORY_ORDER[normalized] ?? 999;
}
