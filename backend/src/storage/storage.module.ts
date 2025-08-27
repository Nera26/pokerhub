import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from './file.entity';
import { S3Service } from './s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity])],
  providers: [S3Service],
  exports: [S3Service, TypeOrmModule],
})
export class StorageModule {}
