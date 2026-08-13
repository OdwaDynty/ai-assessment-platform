-- CreateEnum
CREATE TYPE "BloomsLevel" AS ENUM ('REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'GENERATING', 'GENERATED', 'FAILED');

-- AlterTable: add generation tracking to assessment_question_type_configs
ALTER TABLE "assessment_question_type_configs" ADD COLUMN "generation_status" "GenerationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "assessment_question_type_configs" ADD COLUMN "generation_error" TEXT;

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "question_type_config_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "marks" INTEGER NOT NULL,
    "blooms_level" "BloomsLevel" NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL,
    "options_data" JSONB,
    "memorandum" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_learning_outcomes" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "learning_outcome_id" TEXT NOT NULL,

    CONSTRAINT "question_learning_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "question_learning_outcomes_question_id_learning_outcome_i_key" ON "question_learning_outcomes"("question_id", "learning_outcome_id");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_question_type_config_id_fkey" FOREIGN KEY ("question_type_config_id") REFERENCES "assessment_question_type_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_learning_outcomes" ADD CONSTRAINT "question_learning_outcomes_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_learning_outcomes" ADD CONSTRAINT "question_learning_outcomes_learning_outcome_id_fkey" FOREIGN KEY ("learning_outcome_id") REFERENCES "learning_outcomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;