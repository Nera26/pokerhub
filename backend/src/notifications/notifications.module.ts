import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsListener } from './notifications.listener';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  providers: [NotificationsService, NotificationsListener],
  controllers: [NotificationsController],
})
export class NotificationsModule {}

