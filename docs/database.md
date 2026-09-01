# Database

PostgreSQL with Prisma ORM.

## Models

User, Session, Trip, TripPreference, Destination, ItineraryDay, ItineraryItem, Booking, Expense, TripEvent, ChatSession, ChatMessage, Payment, AiRun

## Commands

```bash
npm run db:migrate   # Apply migrations
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
```

## Demo Seed Data

- **User:** demo@yolo.travel
- **Planned trip:** Delhi → Manali road trip (6 days, 3 destinations)
- **Draft trip:** Goa Beach Escape
- **Completed trip:** Jaipur Heritage Weekend (with expenses)
