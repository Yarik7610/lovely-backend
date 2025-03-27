import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common"
import { UsersService } from "./users.service"

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(":id")
  getById(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.getUserById(id)
  }
}
