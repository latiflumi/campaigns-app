-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar" BYTEA,
ADD COLUMN     "avatarType" TEXT,
ADD COLUMN     "avatarUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Europe/Belgrade';
