-- AlterTable
ALTER TABLE "Event" ADD COLUMN "browser" TEXT;
ALTER TABLE "Event" ADD COLUMN "city" TEXT;
ALTER TABLE "Event" ADD COLUMN "country" TEXT;
ALTER TABLE "Event" ADD COLUMN "deviceType" TEXT;
ALTER TABLE "Event" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "Event" ADD COLUMN "os" TEXT;
ALTER TABLE "Event" ADD COLUMN "region" TEXT;
ALTER TABLE "Event" ADD COLUMN "userAgent" TEXT;

-- CreateIndex
CREATE INDEX "Event_deviceType_idx" ON "Event"("deviceType");

-- CreateIndex
CREATE INDEX "Event_country_idx" ON "Event"("country");
