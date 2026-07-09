-- CreateEnum
CREATE TYPE "ChequeType" AS ENUM ('INWARD', 'OUTWARD');

-- CreateEnum
CREATE TYPE "ChequeStatus" AS ENUM ('PENDING', 'DEPOSITED', 'REALISED', 'BOUNCED', 'CANCELLED');

-- CreateTable
CREATE TABLE "cheques" (
    "id" SERIAL NOT NULL,
    "chequeType" "ChequeType" NOT NULL,
    "chequeNo" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "branchName" TEXT,
    "amount" DECIMAL(13,2) NOT NULL,
    "partyName" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chequeDate" TIMESTAMP(3) NOT NULL,
    "realisingDate" TIMESTAMP(3),
    "status" "ChequeStatus" NOT NULL DEFAULT 'PENDING',
    "imageFrontPath" TEXT,
    "imageBackPath" TEXT,
    "notes" TEXT,

    CONSTRAINT "cheques_pkey" PRIMARY KEY ("id")
);
