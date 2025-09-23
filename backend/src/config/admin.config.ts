import { registerAs } from '@nestjs/config';

export default registerAs('admin', () => ({
  sidebar: [],
}));
