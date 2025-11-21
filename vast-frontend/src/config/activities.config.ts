export const ACTIVITY_CONFIG = {
  // Color scheme for activities
  colors: {
    AtHome: '#4e79a7',        // Blue
    AtWork: '#f28e2c',        // Orange
    Transport: '#e15759',     // Red
    AtRestaurant: '#76b7b2',  // Teal
    AtRecreation: '#59a14f',  // Green
  }
};

/**
 * Get the color for a specific activity
 */
export function getActivityColor(activity: string): string {
  return ACTIVITY_CONFIG.colors[activity as keyof typeof ACTIVITY_CONFIG.colors] || '#999999';
}

/**
 * Get all activity names
 */
export function getActivityNames(): string[] {
  return Object.keys(ACTIVITY_CONFIG.colors);
}
