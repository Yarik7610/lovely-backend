import { Module } from "@nestjs/common"
import { PrismaModule } from "./common/prisma/prisma.module"
import { AuthModule } from "./core/auth/auth.module"
import { UsersModule } from "./core/users/users.module"

@Module({
  imports: [PrismaModule, AuthModule, UsersModule]
})
export class AppModule {}
