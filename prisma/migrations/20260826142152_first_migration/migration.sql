/*
  Warnings:

  - The values [SOCIAL,SEARCH,PUSH] on the enum `CampaignType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `targetAudience` on the `campaigns` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CampaignType_new" AS ENUM ('STORE', 'ECOMMERCE', 'SMS', 'EMAIL');
ALTER TABLE "public"."campaigns" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "campaigns" ALTER COLUMN "type" TYPE "CampaignType_new" USING ("type"::text::"CampaignType_new");
ALTER TYPE "CampaignType" RENAME TO "CampaignType_old";
ALTER TYPE "CampaignType_new" RENAME TO "CampaignType";
DROP TYPE "public"."CampaignType_old";
ALTER TABLE "campaigns" ALTER COLUMN "type" SET DEFAULT 'STORE';
COMMIT;

-- AlterTable
ALTER TABLE "campaigns" DROP COLUMN "targetAudience",
ALTER COLUMN "type" SET DEFAULT 'STORE',
ALTER COLUMN "budget" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "stores" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stores_name_key" ON "stores"("name");
