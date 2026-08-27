import { z } from 'zod';

export const tripBasicsSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  startLocationName: z.string().min(1).max(300),
  startLatitude: z.number().min(-90).max(90),
  startLongitude: z.number().min(-180).max(180),
  destinationName: z.string().min(1).max(300),
  destinationLatitude: z.number().min(-90).max(90),
  destinationLongitude: z.number().min(-180).max(180),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  travelerCount: z.number().int().min(1).max(50),
  budgetAmount: z.number().positive().max(10_000_000),
  currency: z.string().length(3).default('INR'),
  interests: z
    .object({
      nature: z.boolean().optional(),
      culture: z.boolean().optional(),
      food: z.boolean().optional(),
      adventure: z.boolean().optional(),
      photography: z.boolean().optional(),
      relaxation: z.boolean().optional(),
      shopping: z.boolean().optional(),
      nightlife: z.boolean().optional(),
    })
    .optional(),
});

export const transportSchema = z.object({
  transportMode: z.enum(['FLIGHT', 'TRAIN', 'BUS', 'CAR', 'BIKE']),
  vehicleDetails: z
    .object({
      vehicle: z.string().optional(),
      fuelType: z.string().optional(),
      mileage: z.number().optional(),
      bikeDetails: z.string().optional(),
      expectedMileage: z.number().optional(),
    })
    .optional(),
});

export const bookingConfirmSchema = z.object({
  type: z.enum(['FLIGHT', 'TRAIN', 'BUS', 'HOTEL', 'OTHER']),
  provider: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  departureLocation: z.string().optional(),
  arrivalLocation: z.string().optional(),
  departureAt: z.string().datetime().optional().nullable(),
  arrivalAt: z.string().datetime().optional().nullable(),
  amount: z.number().nonnegative().optional().nullable(),
  currency: z.string().length(3).optional(),
  bookingUrl: z.string().url().optional().nullable(),
  externalReference: z.string().optional().nullable(),
  status: z.enum(['PLANNED', 'PENDING', 'CONFIRMED', 'CANCELLED']).default('CONFIRMED'),
});

export const stayPreferenceSchema = z.object({
  tier: z.enum(['BUDGET', 'STANDARD', 'PREMIUM']).optional(),
  skip: z.boolean().optional(),
});
