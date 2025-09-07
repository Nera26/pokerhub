import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from '../routes/users.controller';
import { ProfileController } from '../routes/profile.controller';
import { TransactionsController } from '../routes/transactions.controller';
import { User } from '../database/entities/user.entity';
import { UsersService } from './users.service';
import { UserRepository } from './user.repository';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), WalletModule],
  controllers: [UsersController, ProfileController, TransactionsController],
  providers: [UsersService, UserRepository],
  exports: [UsersService],
})
export class UsersModule {}

