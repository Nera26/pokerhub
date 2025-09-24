import { Entity } from 'typeorm';
import { BonusBaseEntity } from './bonus-base.entity';

@Entity('bonus_default')
export class BonusDefaultEntity extends BonusBaseEntity {}
