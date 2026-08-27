import { z } from 'zod';

const destinationCandidateSchema = z.object({
  name: z.string(),
  description: z.string().optional().nullable(),
  recommendedDurationMinutes: z.number().int().positive().optional().nullable(),
  routeRelevanceScore: z.number().min(0).max(1).optional().nullable(),
  preferenceMatchScore: z.number().min(0).max(1).optional().nullable(),
  recommendationReason: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
});

export const discoveryOutputSchema = z.object({
  candidates: z.array(destinationCandidateSchema).max(30),
  summary: z.string().optional().nullable(),
});

const itineraryItemSchema = z.object({
  type: z.enum(['ACTIVITY', 'TRANSPORT', 'MEAL', 'HOTEL', 'FREE_TIME', 'OTHER']).optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  durationMinutes: z.number().int().optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
  destinationName: z.string().optional().nullable(),
});

const itineraryDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
  items: z.array(itineraryItemSchema).default([]),
});

const travelLegSchema = z
  .object({
    title: z.string(),
    durationMinutes: z.number().optional().nullable(),
    departTime: z.string().optional().nullable(),
    arriveTime: z.string().optional().nullable(),
    overnight: z.boolean().optional().nullable(),
    description: z.string().optional().nullable(),
    mode: z.string().optional().nullable(),
  })
  .optional()
  .nullable();

export const optimizerOutputSchema = z.object({
  score: z.number().min(0).max(100),
  whyThisPlan: z.string(),
  travelLeg: travelLegSchema,
  days: z.array(itineraryDaySchema).min(1),
});

export const copilotResponseSchema = z.object({
  message: z.string(),
  suggestions: z.array(z.string()).optional(),
});

export const replanOutputSchema = z.object({
  summary: z.string(),
  removed: z.array(z.string()).default([]),
  added: z.array(z.string()).default([]),
  moved: z
    .array(
      z.object({
        name: z.string(),
        fromDay: z.number().optional(),
        toDay: z.number().optional(),
      }),
    )
    .default([]),
  timeChanges: z
    .array(
      z.object({
        title: z.string(),
        oldTime: z.string().optional().nullable(),
        newTime: z.string().optional().nullable(),
      }),
    )
    .default([]),
  budgetImpact: z.number().optional().nullable(),
});

export const tripSummarySchema = z.object({
  headline: z.string(),
  narrative: z.string(),
  highlights: z.array(z.string()).max(8),
  tipForNextTrip: z.string(),
});
