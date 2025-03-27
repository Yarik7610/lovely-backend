import { BadRequestException, Injectable } from "@nestjs/common"
import { User } from "@prisma/client"
import * as bcrypt from "bcrypt"
import { CreateUserDto } from "../users/dto/create-user.dto"
import { UsersService } from "../users/users.service"
import { SignInDto } from "./dto/sign-in.dto"
import { SignUpDto } from "./dto/sign-up.dto"

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async signUp(signUpDto: SignUpDto): Promise<User> {
    const { email, password, passwordRepeat } = signUpDto
    if (password !== passwordRepeat) throw new BadRequestException("Repeated password and password don't match")

    const possibleUser = await this.usersService.getUserByEmail(email)
    if (possibleUser) throw new BadRequestException("This email is already taken. Try another one")

    const salt = 6
    const hashedPassword = await bcrypt.hash(password, salt)

    const createUserDto: CreateUserDto = {
      email,
      hashedPassword
    }

    const createdUser = await this.usersService.createUser(createUserDto)
    return createdUser
  }

  signIn(signInDto: SignInDto) {
    console.log(signInDto)
  }
}
