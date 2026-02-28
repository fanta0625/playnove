# 完全自定义层级权限系统设计

> 记录时间: 2025-02-28

## 问题

现有的群组权限系统存在以下限制：
1. 角色只能是字符串，无法自定义角色名
2. 权限控制粗糙，只有 `canInvite` 和 `canAssign` 两个布尔值
3. 无法实现层级任命关系（如：班主任→老师→课代表）
4. 无法控制任命权是否可以传递

## 方案对比

### 方案 1：扩展字符串角色
**描述**: 继续使用字符串作为角色，但增加更多字段
**优点**: 简单，改动小
**缺点**:
- 无法验证角色名是否合法
- 无法定义角色的默认权限
- 层级关系难以管理

### 方案 2：RBAC + 层级表
**描述**: 使用 RBAC 系统，增加角色层级表
**优点**:
- 标准的 RBAC 实现
- 层级关系清晰
**缺点**:
- 需要硬编码角色定义
- 不够灵活

### 方案 3：RoleTemplate + RoleAppointment（✅ 选择）
**描述**:
- `RoleTemplate`: 角色模板，完全自定义
- `RolePermission`: 角色权限关联
- `RoleAppointment`: 任命关系，包含 `canDelegate`

**优点**:
- 角色名完全自定义（班主任、爸爸、CEO）
- 权限细粒度控制（15 种权限类型）
- 层级关系通过 `level` 字段定义
- 任命权传递通过 `canDelegate` 精确控制

**缺点**:
- 复杂度增加
- 需要数据迁移

## 决策

**选择**: 方案 3 - RoleTemplate + RoleAppointment

**实施要点**:

### 1. 数据模型
```prisma
model RoleTemplate {
  id       String   @id
  name     String   // 角色名：班主任、老师
  level    Int      // 层级：0最高
  groupId  String?  // 所属群组
  isActive Boolean
}

model RolePermission {
  roleTemplateId String
  permission     Permission  // 15种权限
}

model RoleAppointment {
  fromRoleId  String   // 任命者
  toRoleId    String   //被任命者
  canDelegate Boolean  // ⭐ 是否可传递任命权
}

model GroupMember {
  roleTemplateId String
  canDelegate    Boolean  // 继承自 RoleAppointment
}
```

### 2. 权限类型
```
MANAGE_GROUP          // 管理群组
INVITE_MEMBERS        // 邀请成员
REMOVE_MEMBERS        // 移除成员
APPOINT_ROLE          // 任命角色
CREATE_ROLE           // 创建自定义角色
DELEGATE_APPOINTMENT  // ⭐ 传递任命权
CREATE_TASKS          // 创建任务
ASSIGN_TASKS          // 分配任务
REVIEW_TASKS          // 审查任务
VIEW_ALL_MEMBERS      // 查看所有成员
EDIT_MEMBER_INFO      // 编辑成员信息
VIEW_STATS             // 查看统计
VIEW_REPORTS           // 查看报告
MANAGE_GAMES           // 管理游戏
VIEW_GAME_RECORDS      // 查看游戏记录
```

### 3. 使用场景示例

#### 场景 1：班级群组
```
角色任命链：
班主任 (level 0)
  └─ 任命 → 数学老师 (canDelegate: true) ✅
      └─ 任命 → 课代表 (canDelegate: true) ✅
          └─ 任命 → 学生 (canDelegate: false) ❌ 终结
```

#### 场景 2：家庭群组
```
爸爸 (level 0)
  └─ 任命 → 妈妈 (canDelegate: true) ✅ 平权
      └─ 任命 → 孩子 (canDelegate: false) ❌
```

### 4. API 设计
```typescript
// 创建角色
POST /api/groups/:groupId/roles
Body: { name, level, permissions[] }

// 设置任命关系
POST /api/groups/:groupId/roles/appointments
Body: { fromRoleId, toRoleId, canDelegate }

// 任命成员
POST /api/groups/:groupId/members/:userId/appoint
Body: { roleTemplateId }
// canDelegate 自动从 RoleAppointment 继承
```

## 理由

1. **灵活性**: 角色名完全自定义，适应各种组织
2. **精确控制**: `canDelegate` 精确控制任命权传递
3. **可扩展**: 权限类型可扩展，不受限制
4. **层级清晰**: 通过 `level` 字段明确层级关系

## 相关文件

- [Schema 设计](/home/wangxin/projects/playnove/backend/prisma/schema.prisma)
- [角色服务](/home/wangxin/projects/playnove/backend/src/modules/roles/)
- [权限服务](/home/wangxin/projects/playnove/backend/src/modules/roles/permissions.service.ts)
- [任命服务](/home/wangxin/projects/playnove/backend/src/modules/roles/appointments.service.ts)

---

*此文档记录重要的架构设计，供后续参考*
