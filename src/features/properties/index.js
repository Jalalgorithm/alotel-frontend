/** Public API of the properties feature. */

// Screens
export { PropertiesPage } from './components/PropertiesPage';
export { PropertyDetailPage } from './components/PropertyDetailPage';
export { SearchPage } from './components/SearchPage';

// Components reused by other features (home, dashboard)
export { PropertyCard } from './components/PropertyCard';
export { PropertyGrid } from './components/PropertyGrid';

// Hooks
export { useProperties, useFeaturedProperties } from './hooks/useProperties';
export { useProperty, usePropertyAvailability, useSimilarProperties } from './hooks/useProperty';

// Service — the booking feature needs to resolve a property by id.
export { propertyService } from './services/propertyService';

// Saved properties (wishlist)
export { wishlistService } from './services/wishlistService';
export {
  useSavedProperties,
  useToggleFavorite,
  useIsFavorite,
  useMergeLocalFavorites,
} from './hooks/useFavorites';
