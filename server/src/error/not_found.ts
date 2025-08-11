import { BaseResponse } from "./base_response";

export class NotFound extends BaseResponse {
    constructor(message = "Not found") {
      super(message, 404);
    }
  }