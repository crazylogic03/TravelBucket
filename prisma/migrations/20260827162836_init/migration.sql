-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('DRAFT', 'PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('FLIGHT', 'TRAIN', 'BUS', 'CAR', 'BIKE');

-- CreateEnum
CREATE TYPE "DestinationStatus" AS ENUM ('PLANNED', 'CURRENT', 'VISITED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('FLIGHT', 'TRAIN', 'BUS', 'HOTEL', 'OTHER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PLANNED', 'PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('TRANSPORT', 'HOTEL', 'FOOD', 'ACTIVITY', 'SHOPPING', 'OTHER');

-- CreateEnum
CREATE TYPE "TripEventType" AS ENUM ('TRIP_CREATED', 'TRIP_PLANNED', 'TRIP_STARTED', 'DESTINATION_CURRENT', 'DESTINATION_VISITED', 'DESTINATION_SKIPPED', 'EXPENSE_ADDED', 'EXPENSE_UPDATED', 'EXPENSE_DELETED', 'ITINERARY_REPLANNED', 'TRIP_COMPLETED');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT', 'TOOL');

-- CreateEnum
CREATE TYPE "ChatMode" AS ENUM ('PLANNING', 'ACTIVE_TRIP', 'GENERAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AiRunStatus" AS ENUM ('STARTED', 'SUCCESS', 'FAILED', 'FALLBACK');

-- CreateEnum
CREATE TYPE "ItineraryItemType" AS ENUM ('ACTIVITY', 'TRANSPORT', 'MEAL', 'HOTEL', 'FREE_TIME', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipHash" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startLocationName" TEXT NOT NULL,
    "startLatitude" DOUBLE PRECISION NOT NULL,
    "startLongitude" DOUBLE PRECISION NOT NULL,
    "destinationName" TEXT NOT NULL,
    "destinationLatitude" DOUBLE PRECISION NOT NULL,
    "destinationLongitude" DOUBLE PRECISION NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "numberOfDays" INTEGER NOT NULL,
    "travelerCount" INTEGER NOT NULL,
    "budgetAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "transportMode" "TransportMode",
    "status" "TripStatus" NOT NULL DEFAULT 'DRAFT',
    "progressPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripPreference" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "nature" BOOLEAN NOT NULL DEFAULT false,
    "culture" BOOLEAN NOT NULL DEFAULT false,
    "food" BOOLEAN NOT NULL DEFAULT false,
    "adventure" BOOLEAN NOT NULL DEFAULT false,
    "photography" BOOLEAN NOT NULL DEFAULT false,
    "relaxation" BOOLEAN NOT NULL DEFAULT false,
    "shopping" BOOLEAN NOT NULL DEFAULT false,
    "nightlife" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "famousFor" TEXT,
    "bestTime" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "recommendedDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "estimatedCost" DECIMAL(12,2),
    "routeRelevanceScore" DOUBLE PRECISION,
    "preferenceMatchScore" DOUBLE PRECISION,
    "recommendationReason" TEXT,
    "imageUrl" TEXT,
    "status" "DestinationStatus" NOT NULL DEFAULT 'PLANNED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "visitedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "skipReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryDay" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT,
    "notes" TEXT,
    "estimatedCost" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItineraryDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryItem" (
    "id" TEXT NOT NULL,
    "itineraryDayId" TEXT NOT NULL,
    "destinationId" TEXT,
    "type" "ItineraryItemType" NOT NULL DEFAULT 'ACTIVITY',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "durationMinutes" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "estimatedCost" DECIMAL(12,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItineraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BookingType" NOT NULL,
    "provider" TEXT NOT NULL,
    "externalReference" TEXT,
    "title" TEXT NOT NULL,
    "departureLocation" TEXT,
    "arrivalLocation" TEXT,
    "departureAt" TIMESTAMP(3),
    "arrivalAt" TIMESTAMP(3),
    "amount" DECIMAL(12,2),
    "currency" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PLANNED',
    "bookingUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "description" TEXT NOT NULL,
    "expenseDate" DATE NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripEvent" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "TripEventType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "ChatMode" NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "chatSessionId" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "toolCalls" JSONB,
    "toolResults" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "tripId" TEXT,
    "userId" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "purpose" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "tripId" TEXT,
    "agentType" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'groq',
    "keyPoolSlot" INTEGER,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "latencyMs" INTEGER,
    "status" "AiRunStatus" NOT NULL DEFAULT 'STARTED',
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_googleId_idx" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_tokenHash_idx" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Trip_userId_idx" ON "Trip"("userId");

-- CreateIndex
CREATE INDEX "Trip_status_idx" ON "Trip"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TripPreference_tripId_key" ON "TripPreference"("tripId");

-- CreateIndex
CREATE INDEX "Destination_tripId_idx" ON "Destination"("tripId");

-- CreateIndex
CREATE INDEX "Destination_status_idx" ON "Destination"("status");

-- CreateIndex
CREATE INDEX "ItineraryDay_tripId_idx" ON "ItineraryDay"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryDay_tripId_dayNumber_key" ON "ItineraryDay"("tripId", "dayNumber");

-- CreateIndex
CREATE INDEX "ItineraryItem_itineraryDayId_idx" ON "ItineraryItem"("itineraryDayId");

-- CreateIndex
CREATE INDEX "Booking_tripId_idx" ON "Booking"("tripId");

-- CreateIndex
CREATE INDEX "Expense_tripId_idx" ON "Expense"("tripId");

-- CreateIndex
CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");

-- CreateIndex
CREATE INDEX "TripEvent_tripId_idx" ON "TripEvent"("tripId");

-- CreateIndex
CREATE INDEX "TripEvent_timestamp_idx" ON "TripEvent"("timestamp");

-- CreateIndex
CREATE INDEX "ChatSession_tripId_idx" ON "ChatSession"("tripId");

-- CreateIndex
CREATE INDEX "ChatMessage_chatSessionId_idx" ON "ChatMessage"("chatSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayOrderId_key" ON "Payment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON "Payment"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_tripId_idx" ON "Payment"("tripId");

-- CreateIndex
CREATE INDEX "AiRun_tripId_idx" ON "AiRun"("tripId");

-- CreateIndex
CREATE INDEX "AiRun_createdAt_idx" ON "AiRun"("createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPreference" ADD CONSTRAINT "TripPreference_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Destination" ADD CONSTRAINT "Destination_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryDay" ADD CONSTRAINT "ItineraryDay_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryItem" ADD CONSTRAINT "ItineraryItem_itineraryDayId_fkey" FOREIGN KEY ("itineraryDayId") REFERENCES "ItineraryDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryItem" ADD CONSTRAINT "ItineraryItem_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripEvent" ADD CONSTRAINT "TripEvent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripEvent" ADD CONSTRAINT "TripEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRun" ADD CONSTRAINT "AiRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRun" ADD CONSTRAINT "AiRun_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
