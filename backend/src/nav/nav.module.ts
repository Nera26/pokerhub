import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NavController } from './nav.controller';
import { NavService } from './nav.service';
import { NavItemEntity } from '../database/entities/nav-item.entity';
import { AdminNavController } from './admin-nav.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NavItemEntity])],
  controllers: [NavController, AdminNavController],
  providers: [NavService],
  exports: [NavService],
})
export class NavModule {}
