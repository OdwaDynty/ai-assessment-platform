-- CreateEnum
CREATE TYPE "BankQuestionSource" AS ENUM ('SAVED_FROM_ASSESSMENT', 'MANUALLY_CREATED');

-- CreateTable
CREATE TABLE "bank_questions" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "marks" INTEGER NOT NULL,
    "question_type" "QuestionType" NOT NULL,
    "blooms_level" "BloomsLevel" NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL,
    "options_data" JSONB,
    "memorandum" TEXT NOT NULL,
    "source" "BankQuestionSource" NOT NULL DEFAULT 'SAVED_FROM_ASSESSMENT',
    "source_assessment_title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_questions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bank_questions" ADD CONSTRAINT "bank_questions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;