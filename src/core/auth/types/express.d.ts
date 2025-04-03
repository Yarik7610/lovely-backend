import { JwtUserPayload } from "./jwt-payloads"

declare module "express" {
  interface Request {
    user: JwtUserPayload
  }
}
