-- AlterTable
ALTER TABLE "users" ADD COLUMN     "institution_id" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_login_at" TIMESTAMP(3);
