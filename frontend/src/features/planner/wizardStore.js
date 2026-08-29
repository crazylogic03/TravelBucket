import { create } from 'zustand';

/**
 * Wizard draft state held while navigating between steps.
 */
export const useWizardStore = create((set) => ({
  tripId: null,
  trip: null,
  vehicleDetails: {},
  stayTier: 'STANDARD',

  setTripId(tripId) {
    set({ tripId });
  },

  setTrip(trip) {
    set({ trip, tripId: trip?.id || null });
  },

  setVehicleDetails(vehicleDetails) {
    set({ vehicleDetails });
  },

  setStayTier(stayTier) {
    set({ stayTier });
  },

  reset() {
    set({ tripId: null, trip: null, vehicleDetails: {}, stayTier: 'STANDARD' });
  },
}));
