/**
 * Building types available in the dataset
 */
export type BuildingType = 'Pub' | 'Restaurant' | 'Apartment' | 'Employer' | 'School';

/**
 * A coordinate pair [x, y]
 */
export type Coordinate = [number, number];

/**
 * Main building polygon data structure
 */
export interface BuildingPolygonData {
  building_id: number;
  building_type: BuildingType;
  polygon: Coordinate[];  // Array of [x, y] coordinates
}

/**
 * Filter state for building types
 */
export interface BuildingTypeFilters {
  Pub: boolean;
  Restaurant: boolean;
  Apartment: boolean;
  Employer: boolean;
  School: boolean;
}
