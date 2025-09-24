import { Column, Entity } from 'typeorm';
import { BonusBaseEntity } from './bonus-base.entity';

@Entity('bonus')
export class BonusEntity extends BonusBaseEntity {
  @Column({ type: 'integer', default: 0 })
  claimsTotal: number;

  @Column({ type: 'integer', default: 0 })
  claimsWeek: number;
}
