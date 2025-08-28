export interface CountryProvider {
  getCountry(ip: string): Promise<string>;
}
