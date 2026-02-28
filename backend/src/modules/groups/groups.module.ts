import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';

@Module({
    imports: [PrismaModule, RolesModule],
    controllers: [GroupsController],
    providers: [
        GroupsService,
    ],
    exports: [GroupsService],
})
export class GroupsModule { }
