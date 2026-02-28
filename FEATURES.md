# 功能模块文档

本文档介绍PlayNova平台的核心功能模块及其使用方法。

---

## 目录

- [群组系统](#群组系统)
- [微信登录](#微信登录)
- [权限系统](#权限系统)

---

## 群组系统

### 📚 功能概述

通用群组系统支持多种场景：
- ✅ 班级管理（班主任、老师、学生）
- ✅ 家庭管理（爸爸、妈妈、孩子）
- ✅ 兴趣小组（组长、成员）
- ✅ 培训班（讲师、学员）

### 🎯 设计理念

群组是一个通用的容器，可以适应各种使用场景。

#### 群组类型（GroupType）

- `CLASS` - 班级
- `FAMILY` - 家庭
- `INTEREST` - 兴趣小组
- `TRAINING` - 培训班
- `OTHER` - 其他

#### 角色（role字段）

角色是完全自定义的字符串，例如：
- "班主任"、"数学老师"、"生活老师"
- "爸爸"、"妈妈"、"爷爷"、"奶奶"
- "学生"、"组长"、"成员"

#### 权限控制

- `canInvite` - 是否可以邀请他人加入群组
- `canAssign` - 是否可以添加/移除/修改其他成员

### 🚀 快速开始

#### 场景1：幼儿园班级

**步骤：**

1. **创建班级群组**
```bash
POST /api/groups
{
  "name": "阳光幼儿园小班",
  "type": "CLASS",
  "maxMembers": 30
}
```

2. **班主任创建邀请码**
```bash
POST /api/groups/{groupId}/invitations
{
  "maxUses": 30,
  "defaultRole": "学生"
}
```

3. **其他老师加入**
```bash
POST /api/groups/{groupId}/members
{
  "userId": "teacher-id",
  "role": "数学老师",
  "canInvite": true,
  "canAssign": false
}
```

4. **家长带孩子加入**
```bash
POST /api/groups/invitations/accept/{code}
```

#### 场景2：家庭群组

**步骤：**

1. 爸爸创建家庭群组（type: "FAMILY"）
2. 爸爸创建邀请码分享给妈妈
3. 妈妈使用邀请码加入
4. 爸爸给妈妈分配canInvite和canAssign权限

#### 场景3：兴趣小组

**步骤：**

1. 创建兴趣小组（type: "INTEREST"）
2. 发布任务（type: "ACTIVITY"）
3. 成员完成任务并提交

### 📋 API 接口清单

#### 群组管理

- `POST /api/groups` - 创建群组
- `GET /api/groups/my` - 获取我的群组
- `GET /api/groups/:id` - 获取群组详情
- `PUT /api/groups/:id` - 更新群组（仅创建者）
- `DELETE /api/groups/:id` - 删除群组（仅创建者）

#### 群组成员管理

- `POST /api/groups/:groupId/members` - 添加成员（需要canAssign）
- `PUT /api/groups/:groupId/members/:memberId` - 修改成员角色（需要canAssign）
- `DELETE /api/groups/:groupId/members/:memberId` - 移除成员（需要canAssign）
- `POST /api/groups/:groupId/leave` - 退出群组

#### 群组邀请码管理

- `POST /api/groups/:groupId/invitations` - 创建邀请码（需要canInvite）
- `GET /api/groups/:groupId/invitations` - 获取群组邀请码
- `PUT /api/groups/invitations/:id` - 更新邀请码（需要canInvite）
- `DELETE /api/groups/invitations/:id` - 删除邀请码（需要canInvite）
- `POST /api/groups/invitations/accept/:code` - 使用邀请码加入

#### 群组任务管理

- `POST /api/groups/:groupId/tasks` - 创建任务
- `GET /api/groups/:groupId/tasks` - 获取群组任务列表
- `GET /api/groups/tasks/:id` - 获取任务详情
- `PUT /api/groups/tasks/:id` - 更新任务
- `DELETE /api/groups/tasks/:id` - 删除任务

#### 任务提交管理

- `GET /api/groups/my-tasks` - 获取我的任务
- `POST /api/groups/tasks/:id/submit` - 提交任务

### 🔒 权限矩阵

| 操作 | 创建者 | canAssign | canInvite | 普通成员 |
|------|--------|-----------|-----------|----------|
| 修改群组 | ✅ | ❌ | ❌ | ❌ |
| 删除群组 | ✅ | ❌ | ❌ | ❌ |
| 添加成员 | ✅ | ✅ | ❌ | ❌ |
| 修改成员角色 | ✅ | ✅ | ❌ | ❌ |
| 移除成员 | ✅ | ✅ | ❌ | ❌ |
| 创建邀请码 | ✅ | ✅ | ✅ | ❌ |
| 创建任务 | ✅ | ✅ | ✅ | ✅ |
| 提交任务 | ✅ | ✅ | ✅ | ✅ |
| 退出群组 | ❌ | ✅ | ✅ | ✅ |

### 📊 数据库表结构

#### groups（群组表）

```sql
- id: 唯一标识
- name: 群组名称
- description: 群组描述
- type: 群组类型
- creatorId: 创建者ID
- maxMembers: 最大成员数
- isActive: 是否激活
```

#### group_members（群组成员表）

```sql
- id: 唯一标识
- groupId: 群组ID
- userId: 用户ID
- role: 自定义角色
- canInvite: 是否可以邀请
- canAssign: 是否可以分配角色
- joinedAt: 加入时间
```

#### group_invitations（群组邀请码表）

```sql
- id: 唯一标识
- groupId: 群组ID
- code: 邀请码（8位）
- maxUses: 最大使用次数
- usedCount: 已使用次数
- expiresAt: 过期时间
- defaultRole: 加入后的默认角色
```

#### group_tasks（群组任务表）

```sql
- id: 唯一标识
- groupId: 群组ID
- createdById: 创建者ID
- title: 任务标题
- description: 任务描述
- type: 任务类型
- gameId: 关联游戏ID
- levelId: 关联关卡ID
- dueDate: 截止日期
```

#### task_submissions（任务提交表）

```sql
- id: 唯一标识
- taskId: 任务ID
- userId: 用户ID
- score: 得分
- maxScore: 满分
- submittedAt: 提交时间
```

### 💡 最佳实践

1. **角色命名** - 使用清晰、易懂的角色名称
2. **权限分配** - 谨慎分配canAssign权限
3. **邀请码管理** - 为不同角色创建不同的邀请码
4. **任务发布** - 发布前确保内容完整

---

## 微信登录

### 📱 概述

支持Web端微信扫码登录和未来微信小程序一键登录。

### 当前状态

- ✅ 前端UI已预留微信登录入口
- ⏳ 后端微信OAuth接口待实现
- ⏳ 前端微信JS-SDK集成待实现
- ⏳ 微信小程序登录待开发

### 🔧 技术方案

#### 1. Web端微信扫码登录

##### 注册微信开放平台

1. 访问 [微信开放平台](https://open.weixin.qq.com/)
2. 注册开发者账号
3. 创建网站应用
4. 获取 `AppID` 和 `AppSecret`
5. 配置授权回调域名

##### 环境配置

```env
# backend/.env
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_REDIRECT_URI=https://yourdomain.com/api/auth/wechat/callback
```

##### 后端实现要点

创建 `WechatModule`，包含：

1. **获取授权URL**
```typescript
getAuthUrl(state: string): string
```

2. **获取access_token**
```typescript
async getAccessToken(code: string)
```

3. **获取用户信息**
```typescript
async getUserInfo(accessToken: string, openid: string)
```

4. **处理回调**
```typescript
@Get('callback')
async handleCallback(@Query('code') code: string)
```

##### 前端实现要点

1. 安装依赖：`npm install qrcode.react`
2. 创建微信登录组件，显示二维码
3. 轮询检查登录状态
4. 登录成功后保存token

#### 2. 微信小程序登录（未来实现）

##### 注册微信小程序

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 注册小程序
3. 获取 `AppID` 和 `AppSecret`

##### 后端接口

```typescript
@Post('miniprogram/login')
async miniprogramLogin(@Body() body: { code: string })
```

##### 小程序前端

```javascript
wx.login({
  success: (res) => {
    // 调用后端登录接口
  }
})
```

### 🔒 安全考虑

- ✅ 使用JWT进行身份验证
- ✅ Access Token有效期短（15分钟）
- ✅ Refresh Token有效期长（7天）
- ✅ HTTPS传输
- ✅ AppSecret仅保存在后端服务器
- ✅ 防止CSRF攻击（使用state参数）

### 📋 开发计划

- [ ] Phase 1: Web端微信扫码登录
- [ ] Phase 2: 小程序基础登录
- [ ] Phase 3: 小程序手机号获取
- [ ] Phase 4: 用户信息同步
- [ ] Phase 5: 数据统计分析

### 📚 参考文档

- [微信开放平台文档](https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html)
- [微信小程序登录文档](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html)

---

## 权限系统

### 🔐 概述

PlayNova实现了完整的权限系统，包括：

- ✅ JWT + Refresh Token双令牌认证
- ✅ 基于角色的访问控制（RBAC）
- ✅ 细粒度的群组权限管理
- ✅ Child账户权限隔离
- ✅ HttpOnly Cookie保护
- ✅ 请求限流防护

### 🎯 权限架构

#### 全局角色（Role枚举）

```typescript
enum Role {
  USER        // 普通用户
  PARENT      // 家长
  SUPER_ADMIN // 超级管理员
}
```

#### 群组内角色（自定义）

群组中的角色完全自定义，例如：
- "班主任"、"老师"、"学生"
- "爸爸"、"妈妈"、"孩子"
- "组长"、"成员"

#### 权限控制机制

1. **路由级别** - 使用Guards（JwtAuthGuard, RolesGuard, GroupMemberGuard等）
2. **控制器级别** - 使用装饰器（@Roles(), @Public()）
3. **Service级别** - 业务逻辑权限验证

### 🛡️ 安全特性

#### 1. 认证与授权

- **JWT认证** - Access Token（15分钟）+ Refresh Token（7天）
- **密码加密** - bcrypt哈希
- **Token验证** - 数据库验证refresh token有效性
- **HttpOnly Cookie** - 防止XSS攻击窃取refresh token

#### 2. RBAC系统

- **@Roles()装饰器** - 声明式角色检查
- **RolesGuard** - 自动验证角色权限
- **灵活的角色定义** - 支持动态角色

#### 3. 群组权限管理

- **GroupMemberGuard** - 检查是否是群组成员
- **GroupCreatorGuard** - 检查是否是群组创建者
- **GroupAdminGuard** - 检查是否有管理权限（canAssign）

#### 4. API安全

- **请求限流** - 每IP每分钟最多60次请求
- **安全头** - Helmet中间件
- **CORS策略** - 严格的跨域控制
- **输入验证** - class-validator验证

### 📊 权限检查流程

```
用户请求
    ↓
JwtAuthGuard（验证JWT）
    ↓
RolesGuard（检查全局角色）
    ↓
GroupMemberGuard（检查群组成员）
    ↓
GroupAdminGuard（检查群组权限）
    ↓
Service层业务逻辑验证
    ↓
执行操作
```

### 🔑 Guards使用示例

#### JWT认证

```typescript
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
```

#### 角色检查

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get('users')
  @Roles('SUPER_ADMIN')
  getAllUsers() {
    // 只有超级管理员可以访问
  }
}
```

#### 群组权限

```typescript
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  @Put(':id')
  @UseGuards(GroupCreatorGuard)
  updateGroup() {
    // 只有群组创建者可以更新
  }

  @Post(':groupId/members')
  @UseGuards(GroupAdminGuard)
  addMember() {
    // 只有有管理权限的用户可以添加成员
  }
}
```

### 📝 最佳实践

1. **默认需要认证** - 所有API端点默认需要JWT认证
2. **使用装饰器** - 使用@Roles()和@Public()声明权限
3. **Service层验证** - 业务逻辑权限检查在Service层
4. **Guard层验证** - 路由级别权限检查使用Guards

### 🔍 权限审查

详细的权限审查报告请参考：[PERMISSION-AUDIT-REPORT.md](./PERMISSION-AUDIT-REPORT.md)

**审查结果：**
- ✅ 所有P0和P1级别问题已修复
- ✅ 实现了完整的RBAC系统
- ✅ 加强了Token安全
- ✅ 添加了多层防护机制

**剩余风险：**
- ⏳ 审计日志系统（建议实现）
- ⏳ 更细粒度的权限控制（建议实现）

---

## 📞 获取帮助

如有问题，请查看：

- [README.md](./README.md) - 项目概览
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 技术架构
- [SECURITY.md](./SECURITY.md) - 安全设计
- [SETUP.md](./SETUP.md) - 环境设置
- [PERMISSION-AUDIT-REPORT.md](./PERMISSION-AUDIT-REPORT.md) - 权限审查报告

---

**最后更新**: 2026年2月28日
