import { getPrisma } from '../../db/prisma.js';
import { publicUser } from './google.service.js';
import { getOrCreateSettings } from './settings.service.js';

/**
 * Aggregate profile statistics from the authenticated user's trips/expenses.
 */
export async function getProfileStats(userId) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const trips = await prisma.trip.findMany({
    where: { userId },
    include: {
      destinations: {
        where: { selected: true },
        orderBy: { sortOrder: 'asc' },
        take: 3,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const expenseAgg = await prisma.expense.aggregate({
    where: { userId },
    _sum: { amount: true },
    _count: true,
  });

  const destinationCount = await prisma.destination.count({
    where: { trip: { userId }, selected: true },
  });

  const settings = await getOrCreateSettings(userId);

  const stats = {
    totalTrips: trips.length,
    activeTrips: trips.filter((t) => t.status === 'ACTIVE').length,
    plannedTrips: trips.filter((t) => t.status === 'PLANNED').length,
    completedTrips: trips.filter((t) => t.status === 'COMPLETED').length,
    draftTrips: trips.filter((t) => t.status === 'DRAFT').length,
    totalDestinations: destinationCount,
    totalExpensesTracked: expenseAgg._count || 0,
    totalExpensesAmount: expenseAgg._sum?.amount != null ? Number(expenseAgg._sum.amount) : 0,
  };

  return {
    user: {
      ...publicUser(user),
      hasPassword: Boolean(user.passwordHash),
      hasGoogle: Boolean(user.googleId),
    },
    stats,
    settings,
    trips: trips.slice(0, 12).map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      startLocationName: t.startLocationName,
      destinationName: t.destinationName,
      startDate: t.startDate,
      endDate: t.endDate,
      budgetAmount: Number(t.budgetAmount),
      currency: t.currency,
      progressPercentage: t.progressPercentage,
      destinations: t.destinations.map((d) => ({
        id: d.id,
        name: d.name,
        imageUrl: d.imageUrl,
      })),
    })),
  };
}

/**
 * List active sessions for security settings (no raw tokens).
 */
export async function listUserSessions(userId, currentTokenHash = null) {
  const prisma = getPrisma();
  const sessions = await prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: 'desc' },
    take: 20,
  });

  return sessions.map((s) => ({
    id: s.id,
    createdAt: s.createdAt,
    lastSeenAt: s.lastSeenAt,
    userAgent: s.userAgent,
    current: currentTokenHash ? s.tokenHash === currentTokenHash : false,
  }));
}
