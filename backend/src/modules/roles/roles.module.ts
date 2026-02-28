import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { AppointmentsService } from './appointments.service';
import { PermissionsService } from './permissions.service';
import { RolesController } from './roles.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RolesController],
  providers: [RolesService, AppointmentsService, PermissionsService],
  exports: [RolesService, AppointmentsService, PermissionsService],
})
export class RolesModule {}
