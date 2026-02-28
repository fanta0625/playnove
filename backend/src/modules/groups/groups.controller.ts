import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
    GroupMemberGuard,
    GroupCreatorGuard,
    GroupAdminGuard,
} from '../../common/guards/group-member.guard';
import {
    CreateGroupDto,
    UpdateGroupDto,
    CreateGroupInvitationDto,
    UpdateGroupInvitationDto,
    AddGroupMemberDto,
    UpdateGroupMemberDto,
    CreateGroupTaskDto,
    UpdateGroupTaskDto,
} from './dto';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
    constructor(private readonly groupsService: GroupsService) { }

    // ========== 群组管理 ==========

    @Post()
    createGroup(@Request() req, @Body() createGroupDto: CreateGroupDto) {
        return this.groupsService.createGroup(req.user.id, createGroupDto);
    }

    @Get('my')
    getMyGroups(@Request() req) {
        return this.groupsService.getMyGroups(req.user.id);
    }

    @Get(':id')
    @UseGuards(GroupMemberGuard)
    getGroup(@Request() req, @Param('id') groupId: string) {
        return this.groupsService.getGroup(groupId, req.user.id);
    }

    @Put(':id')
    @UseGuards(GroupCreatorGuard)
    updateGroup(
        @Request() req,
        @Param('id') groupId: string,
        @Body() updateGroupDto: UpdateGroupDto,
    ) {
        return this.groupsService.updateGroup(
            groupId,
            req.user.id,
            updateGroupDto,
        );
    }

    @Delete(':id')
    @UseGuards(GroupCreatorGuard)
    deleteGroup(@Request() req, @Param('id') groupId: string) {
        return this.groupsService.deleteGroup(groupId, req.user.id);
    }

    // ========== 群组成员管理 ==========

    @Post(':groupId/members')
    @UseGuards(GroupAdminGuard)
    addMember(
        @Request() req,
        @Param('groupId') groupId: string,
        @Body() addGroupMemberDto: AddGroupMemberDto,
    ) {
        return this.groupsService.addMember(groupId, req.user.id, addGroupMemberDto);
    }

    @Put(':groupId/members/:memberId')
    @UseGuards(GroupAdminGuard)
    updateMemberRole(
        @Request() req,
        @Param('groupId') groupId: string,
        @Param('memberId') memberId: string,
        @Body() updateGroupMemberDto: UpdateGroupMemberDto,
    ) {
        return this.groupsService.updateMemberRole(
            groupId,
            memberId,
            req.user.id,
            updateGroupMemberDto,
        );
    }

    @Delete(':groupId/members/:memberId')
    @UseGuards(GroupAdminGuard)
    removeMember(
        @Request() req,
        @Param('groupId') groupId: string,
        @Param('memberId') memberId: string,
    ) {
        return this.groupsService.removeMember(
            groupId,
            memberId,
            req.user.id,
        );
    }

    @Post(':groupId/leave')
    @UseGuards(GroupMemberGuard)
    leaveGroup(@Request() req, @Param('groupId') groupId: string) {
        return this.groupsService.leaveGroup(groupId, req.user.id);
    }

    // ========== 群组邀请码管理 ==========

    @Post(':groupId/invitations')
    @UseGuards(GroupAdminGuard)
    createInvitation(
        @Request() req,
        @Param('groupId') groupId: string,
        @Body() createGroupInvitationDto: CreateGroupInvitationDto,
    ) {
        return this.groupsService.createInvitation(
            groupId,
            req.user.id,
            createGroupInvitationDto,
        );
    }

    @Get(':groupId/invitations')
    @UseGuards(GroupMemberGuard)
    getGroupInvitations(
        @Request() req,
        @Param('groupId') groupId: string,
    ) {
        return this.groupsService.getGroupInvitations(groupId, req.user.id);
    }

    @Put('invitations/:id')
    @UseGuards(GroupAdminGuard)
    updateInvitation(
        @Request() req,
        @Param('id') invitationId: string,
        @Body() updateGroupInvitationDto: UpdateGroupInvitationDto,
    ) {
        return this.groupsService.updateInvitation(
            invitationId,
            req.user.id,
            updateGroupInvitationDto,
        );
    }

    @Delete('invitations/:id')
    @UseGuards(GroupAdminGuard)
    deleteInvitation(@Request() req, @Param('id') invitationId: string) {
        return this.groupsService.deleteInvitation(invitationId, req.user.id);
    }

    @Post('invitations/accept/:code')
    acceptInvitation(
        @Request() req,
        @Param('code') code: string,
    ) {
        return this.groupsService.acceptInvitation(code, req.user.id);
    }

    // ========== 群组任务管理 ==========

    @Post(':groupId/tasks')
    @UseGuards(GroupAdminGuard)
    createTask(
        @Request() req,
        @Param('groupId') groupId: string,
        @Body() createGroupTaskDto: CreateGroupTaskDto,
    ) {
        return this.groupsService.createTask(groupId, req.user.id, createGroupTaskDto);
    }

    @Get(':groupId/tasks')
    @UseGuards(GroupMemberGuard)
    getGroupTasks(
        @Request() req,
        @Param('groupId') groupId: string,
    ) {
        return this.groupsService.getGroupTasks(groupId, req.user.id);
    }

    @Get('tasks/:id')
    getGroupTask(
        @Request() req,
        @Param('id') taskId: string,
    ) {
        return this.groupsService.getGroupTask(taskId, req.user.id);
    }

    @Put('tasks/:id')
    @UseGuards(GroupAdminGuard)
    updateTask(
        @Request() req,
        @Param('id') taskId: string,
        @Body() updateGroupTaskDto: UpdateGroupTaskDto,
    ) {
        return this.groupsService.updateTask(taskId, req.user.id, updateGroupTaskDto);
    }

    @Delete('tasks/:id')
    @UseGuards(GroupAdminGuard)
    deleteTask(@Request() req, @Param('id') taskId: string) {
        return this.groupsService.deleteTask(taskId, req.user.id);
    }

    // ========== 任务提交管理 ==========

    @Get('my-tasks')
    getMyTasks(@Request() req) {
        return this.groupsService.getMyTasks(req.user.id);
    }

    @Post('tasks/:id/submit')
    @UseGuards(GroupMemberGuard)
    submitTask(
        @Request() req,
        @Param('id') taskId: string,
        @Body() body: { score?: number; maxScore?: number },
    ) {
        return this.groupsService.submitTask(
            req.user.id,
            taskId,
            body.score,
            body.maxScore,
        );
    }
}
