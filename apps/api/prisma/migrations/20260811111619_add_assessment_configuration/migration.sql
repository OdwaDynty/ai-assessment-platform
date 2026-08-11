-- CreateEnum
CREATE TYPE "NqfLevel" AS ENUM ('LEVEL_5', 'LEVEL_6', 'LEVEL_7', 'LEVEL_8', 'LEVEL_9', 'LEVEL_10');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('TEST', 'EXAM', 'ASSIGNMENT', 'QUIZ');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'SHORT_ANSWER', 'ESSAY', 'TRUE_FALSE', 'SCENARIO_BASED');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'GENERATING', 'GENERATED', 'FAILED');



-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,
    "nqf_level" "NqfLevel" NOT NULL,
    "assessment_type" "AssessmentType" NOT NULL,
    "total_duration_minutes" INTEGER NOT NULL,
    "total_marks" INTEGER NOT NULL,
    "blooms_distribution" JSONB NOT NULL,
    "difficulty_distribution" JSONB NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_documents" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_question_type_configs" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "question_type" "QuestionType" NOT NULL,
    "question_count" INTEGER NOT NULL,
    "marks_per_question" INTEGER NOT NULL,

    CONSTRAINT "assessment_question_type_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assessment_documents_assessment_id_document_id_key" ON "assessment_documents"("assessment_id", "document_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_question_type_configs_assessment_id_question_typ_key" ON "assessment_question_type_configs"("assessment_id", "question_type");

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_documents" ADD CONSTRAINT "assessment_documents_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_documents" ADD CONSTRAINT "assessment_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_question_type_configs" ADD CONSTRAINT "assessment_question_type_configs_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
