import { IsString, IsOptional, IsInt, IsBoolean, IsDateString, Min, Max, IsEnum } from 'class-validator';

export class CreateGroupDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    type?: 'CLASS' | 'FAMILY' | 'INTEREST' | 'TRAINING' | 'OTHER';

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(1000)
    maxMembers?: number;
}

export class UpdateGroupDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class CreateGroupInvitationDto {
    @IsInt()
    @Min(1)
    @Max(100)
    maxUses: number;

    @IsOptional()
    @IsDateString()
    expiresAt?: string;

    @IsOptional()
    @IsString()
    defaultRole?: string;
}

export class UpdateGroupInvitationDto {
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class AddGroupMemberDto {
    @IsString()
    userId: string;

    @IsString()
    role: string;

    @IsOptional()
    @IsBoolean()
    canInvite?: boolean;

    @IsOptional()
    @IsBoolean()
    canAssign?: boolean;
}

export class UpdateGroupMemberDto {
    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsBoolean()
    canInvite?: boolean;

    @IsOptional()
    @IsBoolean()
    canAssign?: boolean;
}

export class CreateGroupTaskDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    type?: 'HOMEWORK' | 'ACTIVITY' | 'CHALLENGE' | 'EXERCISE' | 'OTHER';

    @IsOptional()
    @IsString()
    gameId?: string;

    @IsOptional()
    @IsString()
    levelId?: string;

    @IsOptional()
    @IsDateString()
    dueDate?: string;
}

export class UpdateGroupTaskDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;

    @IsOptional()
    @IsDateString()
    dueDate?: string;
}
