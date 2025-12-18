import { defineConfig, env } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  datasource: {
    provider: 'sqlite',
    url: env('DATABASE_URL'),
  },
});
