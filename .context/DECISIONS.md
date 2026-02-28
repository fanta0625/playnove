# 关键决策记录

> 本文件记录项目中的重大架构决策和设计变更

**使用方法**:
- 重大决策时运行: `ai-context decision`
- 重要讨论保存: `ai-context discussion`

---

## 2025-02-28: 用户系统和权限管理重构

**背景**:
- `children` 表命名不够通用，只适用于家庭场景
- 原有的群组权限系统不够灵活
- 需要支持自定义角色名（班主任、老师、爸爸等）
- 需要支持任命权传递（班主任→老师→课代表）

**决策**:
1. 重命名 `children` → `member_profiles`（成员档案）
   - 更通用的命名，支持多种场景
   - 添加 `MemberType` 枚举（STUDENT, CHILD, EMPLOYEE, PATIENT, OTHER）

2. 实现完全自定义层级权限系统：
   - `RoleTemplate` 表：自定义角色名和层级
   - `RolePermission` 表：定义每个角色的权限
   - `RoleAppointment` 表：定义任命关系 + **canDelegate**

3. 任命权传递机制：
   - 通过 `canDelegate` 字段控制
   - 从 `RoleAppointment` 继承到 `GroupMember.canDelegate`
   - 例如：班主任任命老师时设置 `canDelegate: true`，老师可以继续任命课代表

**理由**:
- 支持多种组织结构（班级、家庭、公司等）
- 角色名完全自定义，不限制固定值
- 层级任命关系更符合现实场景
- 通过 `canDelegate` 精确控制任命权传递

**影响范围**:
- 数据库 Schema：新增 4 个表，修改 3 个表
- 后端：新增 `RolesModule`，更新 `GroupsService`
- API：新增 10 个角色管理端点
- 迁移：需要数据迁移脚本

**相关文件**:
- `backend/prisma/schema.prisma`
- `backend/src/modules/roles/`
- `backend/prisma/migrations/20260228215600_user_system_and_permission_refactor/`

---

## 2025-02-28: 文档管理策略

**背景**:
- 和 AI 对话产生很多有价值的内容
- 不希望保存成大量 MD 文档
- 需要平衡"记录重要内容"和"保持简洁"

**决策**:
采用三级文档结构：

1. **`.context/DECISIONS.md`** - 关键决策（快速查阅）
   - 只记录重大架构决策
   - 格式：问题 → 决策 → 理由 → 影响
   - 按时间倒序排列

2. **`.docs/design/`** - 设计文档（重要讨论）
   - 保存重要的设计讨论
   - 跨模块的设计方案
   - 需要反复参考的内容

3. **`.ai/sessions/`** - 对话归档（可选）
   - 临时性讨论
   - 问题排查记录
   - 定期清理或归档

**什么不保存**:
- ❌ 简单的 bug 修复
- ❌ 临时代码调试
- ❌ 已实现的功能记录（在 SUMMARY.md）

**理由**:
- 重大决策值得保留，方便新成员了解历史
- 设计文档可以复用，避免重复讨论
- 临时内容不保存，保持文档简洁

**影响范围**:
- 新增目录：`.docs/design/`, `.ai/sessions/`
- 新增文件：`.context/DECISIONS.md`
- 更新：`.context/SUMMARY.md`（删除详细设计）

---

**最后更新**: 2025-02-28
