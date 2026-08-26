import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'DemoPass123!';

const DEMO_USER = {
  googleId: 'demo-google-id-yolo-seed',
  email: 'demo@yolo.travel',
  name: 'Demo Traveler',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
};

/** @returns {Promise<void>} */
export async function seed() {
  console.log('Seeding YOLO database...');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: { name: DEMO_USER.name, avatarUrl: DEMO_USER.avatarUrl, passwordHash },
    create: { ...DEMO_USER, passwordHash },
  });

  // Remove existing demo trips to keep seed idempotent
  await prisma.trip.deleteMany({
    where: { userId: user.id, title: { startsWith: '[Demo]' } },
  });

  const startDate = new Date('2026-09-15');
  const endDate = new Date('2026-09-20');

  const plannedTrip = await prisma.trip.create({
    data: {
      userId: user.id,
      title: '[Demo] Delhi to Manali Road Trip',
      startLocationName: 'Delhi, India',
      startLatitude: 28.6139,
      startLongitude: 77.209,
      destinationName: 'Manali, Himachal Pradesh',
      destinationLatitude: 32.2396,
      destinationLongitude: 77.1887,
      startDate,
      endDate,
      numberOfDays: 6,
      travelerCount: 2,
      budgetAmount: 45000,
      currency: 'INR',
      transportMode: 'CAR',
      status: 'PLANNED',
      progressPercentage: 0,
      preference: {
        create: {
          nature: true,
          culture: true,
          food: true,
          adventure: true,
          photography: true,
          relaxation: false,
          shopping: false,
          nightlife: false,
        },
      },
      destinations: {
        create: [
          {
            name: 'Chandigarh Rock Garden',
            description: 'A unique sculpture garden built from industrial and urban waste.',
            famousFor: 'Nek Chand sculptures',
            bestTime: 'Morning',
            latitude: 30.7525,
            longitude: 76.8382,
            recommendedDurationMinutes: 120,
            estimatedCost: 200,
            routeRelevanceScore: 0.92,
            preferenceMatchScore: 0.85,
            recommendationReason: 'Perfect cultural stop en route with excellent photo opportunities.',
            imageUrl:
              'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
            status: 'PLANNED',
            sortOrder: 1,
            selected: true,
          },
          {
            name: 'Mandi',
            description: 'Historic town known as the Varanasi of the Hills.',
            famousFor: 'Temples and riverside ghats',
            bestTime: 'Afternoon',
            latitude: 31.7081,
            longitude: 76.9318,
            recommendedDurationMinutes: 90,
            estimatedCost: 500,
            routeRelevanceScore: 0.88,
            preferenceMatchScore: 0.78,
            recommendationReason: 'Scenic valley views and authentic Himachali cuisine.',
            imageUrl:
              'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
            status: 'PLANNED',
            sortOrder: 2,
            selected: true,
          },
          {
            name: 'Kullu Valley',
            description: 'Lush valley along the Beas River with apple orchards.',
            famousFor: 'Apple orchards and river rafting',
            bestTime: 'Morning',
            latitude: 31.9579,
            longitude: 77.1095,
            recommendedDurationMinutes: 180,
            estimatedCost: 1500,
            routeRelevanceScore: 0.95,
            preferenceMatchScore: 0.91,
            recommendationReason: 'Adventure activities and stunning mountain scenery.',
            imageUrl:
              'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
            status: 'PLANNED',
            sortOrder: 3,
            selected: true,
          },
          {
            name: 'Rohtang Pass',
            description: 'High mountain pass offering snow views and adventure.',
            famousFor: 'Snow activities and panoramic views',
            bestTime: 'Early morning',
            latitude: 32.371,
            longitude: 77.248,
            recommendedDurationMinutes: 240,
            estimatedCost: 2000,
            routeRelevanceScore: 0.7,
            preferenceMatchScore: 0.88,
            recommendationReason: 'Iconic Himalayan experience — weather dependent.',
            imageUrl:
              'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
            status: 'PLANNED',
            sortOrder: 4,
            selected: false,
          },
        ],
      },
      itineraryDays: {
        create: [
          {
            dayNumber: 1,
            date: new Date('2026-09-15'),
            title: 'Delhi → Chandigarh',
            estimatedCost: 3500,
            items: {
              create: [
                {
                  type: 'TRANSPORT',
                  title: 'Drive Delhi to Chandigarh',
                  description: 'Approx 4 hours via NH44',
                  startTime: '06:00',
                  endTime: '10:00',
                  durationMinutes: 240,
                  estimatedCost: 2000,
                  sortOrder: 1,
                },
                {
                  type: 'ACTIVITY',
                  title: 'Chandigarh Rock Garden',
                  startTime: '11:00',
                  endTime: '13:00',
                  durationMinutes: 120,
                  latitude: 30.7525,
                  longitude: 76.8382,
                  estimatedCost: 200,
                  sortOrder: 2,
                },
                {
                  type: 'MEAL',
                  title: 'Lunch in Sector 17',
                  startTime: '13:30',
                  endTime: '14:30',
                  durationMinutes: 60,
                  estimatedCost: 800,
                  sortOrder: 3,
                },
              ],
            },
          },
          {
            dayNumber: 2,
            date: new Date('2026-09-16'),
            title: 'Chandigarh → Mandi → Kullu',
            estimatedCost: 4200,
            items: {
              create: [
                {
                  type: 'TRANSPORT',
                  title: 'Drive to Mandi via hills',
                  startTime: '07:00',
                  endTime: '12:00',
                  durationMinutes: 300,
                  estimatedCost: 2500,
                  sortOrder: 1,
                },
                {
                  type: 'ACTIVITY',
                  title: 'Mandi temple walk',
                  startTime: '12:30',
                  endTime: '14:00',
                  durationMinutes: 90,
                  latitude: 31.7081,
                  longitude: 76.9318,
                  estimatedCost: 500,
                  sortOrder: 2,
                },
              ],
            },
          },
        ],
      },
      bookings: {
        create: [
          {
            userId: user.id,
            type: 'HOTEL',
            provider: 'Booking.com',
            title: 'Hotel Manali Heights',
            arrivalLocation: 'Manali, HP',
            amount: 8500,
            currency: 'INR',
            status: 'CONFIRMED',
            bookingUrl: 'https://www.booking.com',
          },
        ],
      },
      tripEvents: {
        create: [
          { userId: user.id, type: 'TRIP_CREATED' },
          { userId: user.id, type: 'TRIP_PLANNED' },
        ],
      },
    },
    include: { destinations: true },
  });

  // Link itinerary items to destinations where applicable
  const rockGarden = plannedTrip.destinations.find((d) => d.name.includes('Rock Garden'));
  const mandi = plannedTrip.destinations.find((d) => d.name === 'Mandi');

  if (rockGarden) {
    const day1 = await prisma.itineraryDay.findFirst({
      where: { tripId: plannedTrip.id, dayNumber: 1 },
    });
    if (day1) {
      await prisma.itineraryItem.updateMany({
        where: { itineraryDayId: day1.id, title: { contains: 'Rock Garden' } },
        data: { destinationId: rockGarden.id },
      });
    }
  }

  if (mandi) {
    const day2 = await prisma.itineraryDay.findFirst({
      where: { tripId: plannedTrip.id, dayNumber: 2 },
    });
    if (day2) {
      await prisma.itineraryItem.updateMany({
        where: { itineraryDayId: day2.id, title: { contains: 'Mandi' } },
        data: { destinationId: mandi.id },
      });
    }
  }

  // Draft trip
  await prisma.trip.create({
    data: {
      userId: user.id,
      title: '[Demo] Goa Beach Escape (Draft)',
      startLocationName: 'Mumbai, India',
      startLatitude: 19.076,
      startLongitude: 72.8777,
      destinationName: 'Goa, India',
      destinationLatitude: 15.2993,
      destinationLongitude: 74.124,
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-05'),
      numberOfDays: 5,
      travelerCount: 3,
      budgetAmount: 30000,
      currency: 'INR',
      status: 'DRAFT',
      preference: {
        create: {
          nature: false,
          culture: false,
          food: true,
          adventure: false,
          photography: true,
          relaxation: true,
          shopping: false,
          nightlife: true,
        },
      },
      tripEvents: {
        create: [{ userId: user.id, type: 'TRIP_CREATED' }],
      },
    },
  });

  // Completed trip with expenses
  const completedTrip = await prisma.trip.create({
    data: {
      userId: user.id,
      title: '[Demo] Jaipur Heritage Weekend',
      startLocationName: 'Delhi, India',
      startLatitude: 28.6139,
      startLongitude: 77.209,
      destinationName: 'Jaipur, Rajasthan',
      destinationLatitude: 26.9124,
      destinationLongitude: 75.7873,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-03'),
      numberOfDays: 3,
      travelerCount: 2,
      budgetAmount: 15000,
      currency: 'INR',
      transportMode: 'TRAIN',
      status: 'COMPLETED',
      progressPercentage: 100,
      startedAt: new Date('2026-06-01T06:00:00Z'),
      completedAt: new Date('2026-06-03T20:00:00Z'),
      preference: {
        create: { culture: true, food: true, photography: true },
      },
      destinations: {
        create: [
          {
            name: 'Amber Fort',
            description: 'Magnificent hilltop fort with Mughal and Rajput architecture.',
            latitude: 26.9855,
            longitude: 75.8513,
            recommendedDurationMinutes: 180,
            estimatedCost: 500,
            status: 'VISITED',
            sortOrder: 1,
            selected: true,
            visitedAt: new Date('2026-06-01T10:00:00Z'),
            imageUrl:
              'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80',
          },
          {
            name: 'Hawa Mahal',
            description: 'Iconic palace of winds with intricate latticework.',
            latitude: 26.9239,
            longitude: 75.8267,
            recommendedDurationMinutes: 60,
            estimatedCost: 200,
            status: 'VISITED',
            sortOrder: 2,
            selected: true,
            visitedAt: new Date('2026-06-02T09:00:00Z'),
            imageUrl:
              'https://images.unsplash.com/photo-1599661046280-e842bf7a0639?auto=format&fit=crop&w=800&q=80',
          },
          {
            name: 'Jantar Mantar',
            description: 'UNESCO astronomical observation site.',
            latitude: 26.9248,
            longitude: 75.8246,
            recommendedDurationMinutes: 90,
            estimatedCost: 200,
            status: 'SKIPPED',
            sortOrder: 3,
            selected: true,
            skippedAt: new Date('2026-06-02T14:00:00Z'),
            skipReason: 'Running late — chose local market instead',
          },
        ],
      },
      expenses: {
        create: [
          {
            userId: user.id,
            category: 'TRANSPORT',
            amount: 3200,
            description: 'Train tickets Delhi-Jaipur return',
            expenseDate: new Date('2026-06-01'),
          },
          {
            userId: user.id,
            category: 'HOTEL',
            amount: 4500,
            description: 'Heritage haveli stay (2 nights)',
            expenseDate: new Date('2026-06-01'),
          },
          {
            userId: user.id,
            category: 'FOOD',
            amount: 2800,
            description: 'Meals and street food',
            expenseDate: new Date('2026-06-02'),
          },
          {
            userId: user.id,
            category: 'ACTIVITY',
            amount: 1200,
            description: 'Fort entry and guided tour',
            expenseDate: new Date('2026-06-01'),
          },
        ],
      },
      tripEvents: {
        create: [
          { userId: user.id, type: 'TRIP_CREATED' },
          { userId: user.id, type: 'TRIP_PLANNED' },
          { userId: user.id, type: 'TRIP_STARTED' },
          { userId: user.id, type: 'TRIP_COMPLETED' },
        ],
      },
    },
  });

  console.log('Seed complete:');
  console.log(`  User: ${user.email} (${user.id})`);
  console.log(`  Demo login: ${user.email} / ${DEMO_PASSWORD}`);
  console.log(`  Planned trip: ${plannedTrip.title} (${plannedTrip.id})`);
  console.log(`  Completed trip: ${completedTrip.title} (${completedTrip.id})`);
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
