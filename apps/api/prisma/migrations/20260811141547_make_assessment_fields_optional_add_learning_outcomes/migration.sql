-- Make Assessment basics/rigor fields nullable, since drafts start empty
-- and get filled in progressively across the wizard's steps.
ALTER TABLE "assessments" ALTER COLUMN "title" DROP NOT NULL;
ALTER TABLE "assessments" ALTER COLUMN "module_name" DROP NOT NULL;
ALTER TABLE "assessments" ALTER COLUMN "nqf_level" DROP NOT NULL;
ALTER TABLE "assessments" ALTER COLUMN "assessment_type" DROP NOT NULL;
ALTER TABLE "assessments" ALTER COLUMN "total_duration_minutes" DROP NOT NULL;
ALTER TABLE "assessments" ALTER COLUMN "total_marks" DROP NOT NULL;
ALTER TABLE "assessments" ALTER COLUMN "blooms_distribution" DROP NOT NULL;
ALTER TABLE "assessments" ALTER COLUMN "difficulty_distribution" DROP NOT NULL;

-- CreateTable
CREATE TABLE "learning_outcomes" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "learning_outcomes_assessment_id_code_key" ON "learning_outcomes"("assessment_id", "code");

-- AddForeignKey
ALTER TABLE "learning_outcomes" ADD CONSTRAINT "learning_outcomes_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;