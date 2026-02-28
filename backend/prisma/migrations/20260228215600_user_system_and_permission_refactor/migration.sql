-- Step 1: 创建成员类型枚举
CREATE TYPE "MemberType" AS ENUM ('STUDENT', 'CHILD', 'EMPLOYEE', 'PATIENT', 'OTHER');

-- Step 2: 创建权限枚举
CREATE TYPE "Permission" AS ENUM (
  'MANAGE_GROUP',
  'INVITE_MEMBERS',
  'REMOVE_MEMBERS',
  'APPOINT_ROLE',
  'CREATE_ROLE',
  'DELEGATE_APPOINTMENT',
  'CREATE_TASKS',
  'ASSIGN_TASKS',
  'REVIEW_TASKS',
  'VIEW_ALL_MEMBERS',
  'EDIT_MEMBER_INFO',
  'VIEW_STATS',
  'VIEW_REPORTS',
  'MANAGE_GAMES',
  'VIEW_GAME_RECORDS'
);

-- Step 3: 重命名 children 表为 member_profiles
ALTER TABLE "children" RENAME TO "member_profiles";

-- Step 4: 添加 memberType 字段到 member_profiles
ALTER TABLE "member_profiles"
ADD COLUMN "memberType" "MemberType" NOT NULL DEFAULT 'STUDENT';

-- Step 5: 创建角色模板表
CREATE TABLE "role_templates" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "level" INTEGER NOT NULL DEFAULT 0,
  "groupId" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "role_templates_pkey" PRIMARY KEY ("id")
);

-- Step 6: 创建角色权限表
CREATE TABLE "role_permissions" (
  "id" TEXT NOT NULL,
  "roleTemplateId" TEXT NOT NULL,
  "permission" "Permission" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- Step 7: 创建角色任命关系表
CREATE TABLE "role_appointments" (
  "id" TEXT NOT NULL,
  "fromRoleId" TEXT NOT NULL,
  "toRoleId" TEXT NOT NULL,
  "canDelegate" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "role_appointments_pkey" PRIMARY KEY ("id")
);

-- Step 8: 修改 GroupMember 表 - 添加新字段
ALTER TABLE "group_members"
ADD COLUMN "roleTemplateId" TEXT,
ADD COLUMN "canDelegate" BOOLEAN NOT NULL DEFAULT false;

-- Step 9: 创建外键约束
ALTER TABLE "role_templates"
ADD CONSTRAINT "role_templates_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_permissions"
ADD CONSTRAINT "role_permissions_roleTemplateId_fkey" FOREIGN KEY ("roleTemplateId") REFERENCES "role_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_appointments"
ADD CONSTRAINT "role_appointments_fromRoleId_fkey" FOREIGN KEY ("fromRoleId") REFERENCES "role_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_appointments"
ADD CONSTRAINT "role_appointments_toRoleId_fkey" FOREIGN KEY ("toRoleId") REFERENCES "role_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_members"
ADD CONSTRAINT "group_members_roleTemplateId_fkey" FOREIGN KEY ("roleTemplateId") REFERENCES "role_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 10: 修改 PlayRecord 表 - childId → profileId
ALTER TABLE "play_records"
RENAME COLUMN "childId" TO "profileId";

-- Step 11: 修改 AiReport 表 - childId → profileId
ALTER TABLE "ai_reports"
ADD COLUMN IF NOT EXISTS "profileId" TEXT;

-- 如果有旧的 childId 字段，删除它
-- ALTER TABLE "ai_reports" DROP COLUMN IF EXISTS "childId";

-- Step 12: 创建索引
CREATE INDEX IF NOT EXISTS "member_profiles_memberType_idx" ON "member_profiles"("memberType");

CREATE UNIQUE INDEX IF NOT EXISTS "role_templates_groupId_name_key" ON "role_templates"("groupId", "name");
CREATE INDEX IF NOT EXISTS "role_templates_groupId_isActive_idx" ON "role_templates"("groupId", "isActive");

CREATE UNIQUE INDEX IF NOT EXISTS "role_permissions_roleTemplateId_permission_key" ON "role_permissions"("roleTemplateId", "permission");
CREATE INDEX IF NOT EXISTS "role_permissions_roleTemplateId_idx" ON "role_permissions"("roleTemplateId");

CREATE UNIQUE INDEX IF NOT EXISTS "role_appointments_fromRoleId_toRoleId_key" ON "role_appointments"("fromRoleId", "toRoleId");

-- Step 13: 数据迁移 - 为现有群组创建默认角色模板
-- 为每个现有群组创建默认角色
INSERT INTO "role_templates" ("id", "name", "description", "level", "groupId", "isSystem", "isActive", "createdAt", "updatedAt")
SELECT
  'default_role_' || "id",
  '成员',
  '默认成员角色',
  10,
  "id",
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "groups";

-- 为现有群组成员设置默认角色
UPDATE "group_members"
SET "roleTemplateId" = (
  SELECT "id"
  FROM "role_templates"
  WHERE "role_templates"."groupId" = "group_members"."groupId"
  AND "role_templates"."name" = '成员'
  LIMIT 1
)
WHERE "roleTemplateId" IS NULL;

-- Step 14: 删除旧的角色字段（数据迁移完成后）
-- 注意：这会丢失旧的角色字符串数据，如果需要保留可以注释掉
-- ALTER TABLE "group_members" DROP COLUMN IF EXISTS "role";
-- ALTER TABLE "group_members" DROP COLUMN IF EXISTS "canInvite";
-- ALTER TABLE "group_members" DROP COLUMN IF EXISTS "canAssign";
