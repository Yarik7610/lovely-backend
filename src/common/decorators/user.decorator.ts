import { createParamDecorator, ExecutionContext } from "@nestjs/common"
import type { Request } from "express"

export const User = createParamDecorator((_, ctx: ExecutionContext) => {
  const request: Request = ctx.switchToHttp().getRequest()
  return request.user
})
