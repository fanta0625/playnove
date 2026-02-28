/*
  Warnings:

  - The values [TEACHER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `homework_submissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `homeworks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `invitations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_assignments` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('CLASS', 'FAMILY', 'INTEREST', 'TRAINING', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('HOMEWORK', 'ACTIVITY', 'CHALLENGE', 'EXERCISE', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('USER', 'PARENT', 'SUPER_ADMIN');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- DropForeignKey
ALTER TABLE "homework_submissions" DROP CONSTRAINT "homework_submissions_homeworkId_fkey";

-- DropForeignKey
ALTER TABLE "homework_submissions" DROP CONSTRAINT "homework_submissions_studentId_fkey";

-- DropForeignKey
ALTER TABLE "homeworks" DROP CONSTRAINT "homeworks_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "student_assignments" DROP CONSTRAINT "student_assignments_invitationId_fkey";

-- DropForeignKey
ALTER TABLE "student_assignments" DROP CONSTRAINT "student_assignments_studentId_fkey";

-- DropForeignKey
ALTER TABLE "student_assignments" DROP CONSTRAINT "student_assignments_teacherId_fkey";

-- DropTable
DROP TABLE "homework_submissions";

-- DropTable
DROP TABLE "homeworks";

-- DropTable
DROP TABLE "invitations";

-- DropTable
DROP TABLE "student_assignments";

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "GroupType" NOT NULL DEFAULT 'OTHER',
    "creatorId" TEXT NOT NULL,
    "maxMembers" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "canInvite" BOOLEAN NOT NULL DEFAULT false,
    "canAssign" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_invitations" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 10,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_tasks" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL DEFAULT 'HOMEWORK',
    "gameId" TEXT,
    "levelId" TEXT,
    "dueDate" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_submissions" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER,
    "maxScore" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "groups_creatorId_idx" ON "groups"("creatorId");

-- CreateIndex
CREATE INDEX "groups_type_isActive_idx" ON "groups"("type", "isActive");

-- CreateIndex
CREATE INDEX "group_members_groupId_idx" ON "group_members"("groupId");

-- CreateIndex
CREATE INDEX "group_members_userId_idx" ON "group_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_groupId_userId_key" ON "group_members"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_invitations_code_key" ON "group_invitations"("code");

-- CreateIndex
CREATE INDEX "group_invitations_groupId_idx" ON "group_invitations"("groupId");

-- CreateIndex
CREATE INDEX "group_invitations_code_idx" ON "group_invitations"("code");

-- CreateIndex
CREATE INDEX "group_tasks_groupId_idx" ON "group_tasks"("groupId");

-- CreateIndex
CREATE INDEX "group_tasks_createdById_idx" ON "group_tasks"("createdById");

-- CreateIndex
CREATE INDEX "group_tasks_isPublished_idx" ON "group_tasks"("isPublished");

-- CreateIndex
CREATE INDEX "task_submissions_taskId_idx" ON "task_submissions"("taskId");

-- CreateIndex
CREATE INDEX "task_submissions_userId_idx" ON "task_submissions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "task_submissions_taskId_userId_key" ON "task_submissions"("taskId", "userId");

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_tasks" ADD CONSTRAINT "group_tasks_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_tasks" ADD CONSTRAINT "group_tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "group_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
