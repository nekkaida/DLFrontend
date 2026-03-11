import { useState, useEffect } from 'react';
import { Season } from '../services/SeasonService';
import { Category } from '../services/CategoryService';

/**
 * Custom hook to manage season selection state
 *
 * @param categories - Available categories for selection
 * @returns Selected category ID, selected season, and setter functions
 */
export const useSeasonSelection = (categories: Category[]) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);

  // Set default selected category when categories are loaded
  useEffect(() => {
    const firstValidCategory = categories.find((category) => Boolean(category?.id));

    if (firstValidCategory && !selectedCategoryId) {
      setSelectedCategoryId(firstValidCategory.id);
    }

    if (!firstValidCategory && selectedCategoryId) {
      setSelectedCategoryId(null);
    }
  }, [categories, selectedCategoryId]);

  return {
    selectedCategoryId,
    setSelectedCategoryId,
    selectedSeason,
    setSelectedSeason,
  };
};
