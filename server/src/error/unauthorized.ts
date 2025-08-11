import { BaseResponse } from "./base_response";

export class Unauthorized extends BaseResponse {
  constructor(message = "Unauthorized access") {
    super(message, 401);
  }
}
