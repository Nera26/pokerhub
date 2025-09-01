import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import geoip from 'geoip-lite';

@Injectable()
export class GeoIpService {
  constructor(private readonly config: ConfigService) {}

  lookup(ip: string): string | null {
    const res = geoip.lookup(ip);
    return res?.country ?? null;
  }

  isAllowed(ip: string): boolean {
    const country = this.lookup(ip);
    const allowed = this.config.get<string[]>('geo.allowedCountries', []);
    if (!allowed.length) return true;
    if (!country) return false;
    return allowed.includes(country);
  }
}
