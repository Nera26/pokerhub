import { Entity, PrimaryColumn } from 'typeorm';

@Entity('blocked_countries')
export class BlockedCountryEntity {
  @PrimaryColumn()
  country!: string;
}
