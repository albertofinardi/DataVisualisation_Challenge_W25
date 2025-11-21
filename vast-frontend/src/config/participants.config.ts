/**
 * Hardcoded list of all participant IDs
 * This list is static and comes from the VAST Challenge dataset
 * 
 * To regenerate this list, query the backend:
 * GET /api/utils/participants
 */

// Generate participant IDs from 1 to 1011 (standard VAST Challenge participant count)
export const PARTICIPANT_IDS = Array.from({ length: 1011 }, (_, i) => i + 1);

/**
 * Get all participant IDs
 */
export function getParticipantIds(): number[] {
  return PARTICIPANT_IDS;
}

/**
 * Check if a participant ID is valid
 */
export function isValidParticipantId(id: number): boolean {
  return PARTICIPANT_IDS.includes(id);
}
