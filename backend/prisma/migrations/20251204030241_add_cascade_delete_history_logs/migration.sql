-- DropForeignKey
ALTER TABLE "HistoryLog" DROP CONSTRAINT "HistoryLog_monitorId_fkey";

-- CreateTable
CREATE TABLE "StatusPage" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusPageMonitor" (
    "id" SERIAL NOT NULL,
    "statusPageId" INTEGER NOT NULL,
    "monitorId" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusPageMonitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StatusPage_slug_key" ON "StatusPage"("slug");

-- CreateIndex
CREATE INDEX "StatusPage_userId_idx" ON "StatusPage"("userId");

-- CreateIndex
CREATE INDEX "StatusPage_slug_idx" ON "StatusPage"("slug");

-- CreateIndex
CREATE INDEX "StatusPageMonitor_statusPageId_idx" ON "StatusPageMonitor"("statusPageId");

-- CreateIndex
CREATE INDEX "StatusPageMonitor_monitorId_idx" ON "StatusPageMonitor"("monitorId");

-- CreateIndex
CREATE UNIQUE INDEX "StatusPageMonitor_statusPageId_monitorId_key" ON "StatusPageMonitor"("statusPageId", "monitorId");

-- AddForeignKey
ALTER TABLE "HistoryLog" ADD CONSTRAINT "HistoryLog_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPage" ADD CONSTRAINT "StatusPage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPageMonitor" ADD CONSTRAINT "StatusPageMonitor_statusPageId_fkey" FOREIGN KEY ("statusPageId") REFERENCES "StatusPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPageMonitor" ADD CONSTRAINT "StatusPageMonitor_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
