import { z } from 'zod';
import { getPrisma } from '../../db/prisma.js';
import { getOwnedTrip } from '../trips/trip.service.js';
import { calculateBudgetStatus } from './expense.calculator.js';

export const expenseSchema = z.object({
  category: z.enum(['TRANSPORT', 'HOTEL', 'FOOD', 'ACTIVITY', 'SHOPPING', 'OTHER']),
  amount: z.number().positive().max(10_000_000),
  currency: z.string().length(3).default('INR'),
  description: z.string().min(1).max(500),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

function serializeExpense(e) {
  return {
    ...e,
    amount: Number(e.amount),
    expenseDate:
      e.expenseDate instanceof Date
        ? e.expenseDate.toISOString().slice(0, 10)
        : e.expenseDate,
  };
}

export async function listExpenses(tripId, userId) {
  const trip = await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();
  const expenses = await prisma.expense.findMany({
    where: { tripId },
    orderBy: { expenseDate: 'desc' },
  });
  const budget = calculateBudgetStatus({
    ...trip,
    expenses,
  });
  return { expenses: expenses.map(serializeExpense), budget };
}

export async function addExpense(tripId, userId, data) {
  await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();
  const expense = await prisma.expense.create({
    data: {
      tripId,
      userId,
      category: data.category,
      amount: data.amount,
      currency: data.currency || 'INR',
      description: data.description,
      expenseDate: new Date(data.expenseDate),
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    },
  });
  await prisma.tripEvent.create({
    data: {
      tripId,
      userId,
      type: 'EXPENSE_ADDED',
      metadata: { expenseId: expense.id, amount: data.amount, category: data.category },
    },
  });
  return listExpenses(tripId, userId);
}

export async function updateExpense(tripId, userId, expenseId, data) {
  await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();
  const existing = await prisma.expense.findFirst({
    where: { id: expenseId, tripId, userId },
  });
  if (!existing) {
    const err = new Error('Expense not found');
    err.statusCode = 404;
    throw err;
  }
  await prisma.expense.update({
    where: { id: expenseId },
    data: {
      category: data.category,
      amount: data.amount,
      currency: data.currency || existing.currency,
      description: data.description,
      expenseDate: new Date(data.expenseDate),
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    },
  });
  await prisma.tripEvent.create({
    data: {
      tripId,
      userId,
      type: 'EXPENSE_UPDATED',
      metadata: { expenseId },
    },
  });
  return listExpenses(tripId, userId);
}

export async function deleteExpense(tripId, userId, expenseId) {
  await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();
  const existing = await prisma.expense.findFirst({
    where: { id: expenseId, tripId, userId },
  });
  if (!existing) {
    const err = new Error('Expense not found');
    err.statusCode = 404;
    throw err;
  }
  await prisma.expense.delete({ where: { id: expenseId } });
  await prisma.tripEvent.create({
    data: {
      tripId,
      userId,
      type: 'EXPENSE_DELETED',
      metadata: { expenseId },
    },
  });
  return listExpenses(tripId, userId);
}
