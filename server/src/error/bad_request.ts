import { BaseResponse } from "./base_response";

export class BadRequest extends BaseResponse {
  constructor(message = "Bad request") {
    super(message, 400);
  }
}
