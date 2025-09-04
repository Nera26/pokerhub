import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Param, PipeTransform, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const SELF_PARAM_KEY = 'self:param';

export function UserIdParam(param: string = 'id', ...pipes: (Type<PipeTransform> | PipeTransform)[]): ParameterDecorator {
  const paramDecorator = Param(param, ...pipes);
  return (target: object, propertyKey: string | symbol, parameterIndex: number) => {
    Reflect.defineMetadata(SELF_PARAM_KEY, param, target[propertyKey]);
    paramDecorator(target, propertyKey, parameterIndex);
  };
}

@Injectable()
export class SelfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const param = this.reflector.get<string>(SELF_PARAM_KEY, handler) ?? 'id';
    if (req.userId !== req.params?.[param]) {
      throw new ForbiddenException();
    }
    return true;
  }
}
