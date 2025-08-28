import { Injectable } from '@nestjs/common';

@Injectable()
export class KycService {
  private readonly blockedCountries = ['IR', 'KP', 'SY', 'CU', 'RU', 'BY'];

  private readonly sanctionedNames = ['bad actor'];

  private async fetchCountry(ip: string): Promise<string> {
    try {
      const res = await fetch(`https://ipapi.co/${ip}/country/`);
      return (await res.text()).trim();
    } catch {
      return '';
    }
  }

  async checkGeofence(ip: string): Promise<void> {
    const country = await this.fetchCountry(ip);
    if (this.blockedCountries.includes(country)) {
      throw new Error('Blocked jurisdiction');
    }
  }

  async checkSanctions(name: string): Promise<void> {
    const lowered = name.toLowerCase();
    if (this.sanctionedNames.includes(lowered)) {
      throw new Error('Sanctioned individual');
    }
  }

  async verify(name: string, ip: string): Promise<void> {
    await this.checkGeofence(ip);
    await this.checkSanctions(name);
  }
}
