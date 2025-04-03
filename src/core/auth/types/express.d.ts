import { JwtPayload } from "./jwt-payload"

declare module "express" {
  interface Request {
    user: JwtPayload
  }
}
