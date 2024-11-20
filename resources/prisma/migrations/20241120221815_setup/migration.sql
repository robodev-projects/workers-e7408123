/*
  Warnings:

  - You are about to drop the `Rocket` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RocketTimelapse` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RocketTimelapse" DROP CONSTRAINT "RocketTimelapse_rocketId_fkey";

-- DropTable
DROP TABLE "Rocket";

-- DropTable
DROP TABLE "RocketTimelapse";

-- CreateTable
CREATE TABLE "Worker" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerState" (
    "id" UUID NOT NULL,
    "workerId" UUID NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerStatePair" (
    "id" UUID NOT NULL,
    "workerId" UUID NOT NULL,
    "totalSeconds" INTEGER,
    "assignedAt" TIMESTAMP(3) NOT NULL,
    "assignedWorkerStateId" UUID NOT NULL,
    "unassignedAt" TIMESTAMP(3),
    "unassignedWorkerStateId" UUID,

    CONSTRAINT "WorkerStatePair_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WorkerState" ADD CONSTRAINT "WorkerState_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerStatePair" ADD CONSTRAINT "WorkerStatePair_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerStatePair" ADD CONSTRAINT "WorkerStatePair_assignedWorkerStateId_fkey" FOREIGN KEY ("assignedWorkerStateId") REFERENCES "WorkerState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerStatePair" ADD CONSTRAINT "WorkerStatePair_unassignedWorkerStateId_fkey" FOREIGN KEY ("unassignedWorkerStateId") REFERENCES "WorkerState"("id") ON DELETE SET NULL ON UPDATE CASCADE;
