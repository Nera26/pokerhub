import { INestApplication, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../src/routes/users.controller';
import { AuthGuard } from '../../src/auth/auth.guard';
import { AdminGuard } from '../../src/auth/admin.guard';
import { SelfGuard } from '../../src/auth/self.guard';

export async function initUserTestApp(providers: any[]): Promise<INestApplication> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    controllers: [UsersController],
    providers,
  })
    .overrideGuard(AuthGuard)
    .useValue({
      canActivate: (ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        const header = req.headers['authorization'];
        if (typeof header === 'string' && header.startsWith('Bearer ')) {
          req.userId = header.slice(7);
          return true;
        }
        return false;
      },
    })
    .overrideGuard(AdminGuard)
    .useValue({
      canActivate: (ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        const header = req.headers['authorization'];
        if (header === 'Bearer admin') {
          req.userId = 'admin';
          return true;
        }
        return false;
      },
    })
    .overrideGuard(SelfGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}
