-- CreateEnum
CREATE TYPE "Status" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'TIMEOUT', 'FAILED');

-- CreateTable
CREATE TABLE "runs" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'QUEUED',
    "output" TEXT,
    "error" TEXT,
    "execution_time" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "runs_pkey" PRIMARY KEY ("id")
);
