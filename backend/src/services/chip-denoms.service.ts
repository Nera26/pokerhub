import { Injectable } from '@nestjs/common';
import { CHIP_DENOMS } from '@shared/config/chipDenoms';

@Injectable()
export class ChipDenomsService {
  private denoms = [...CHIP_DENOMS];

  get(): number[] {
    return this.denoms;
  }

  update(denoms: number[]): number[] {
    this.denoms = [...denoms];
    return this.denoms;
  }
}
