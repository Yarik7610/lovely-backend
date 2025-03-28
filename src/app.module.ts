import { Module } from "@nestjs/common"
import { DatabaseModule } from "./common/database/database.module"
import { AuthModule } from "./core/auth/auth.module"
import { UsersModule } from "./core/users/users.module"

@Module({
  imports: [DatabaseModule, AuthModule, UsersModule],
  providers: []
})
export class AppModule {}
