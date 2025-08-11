import { BaseResponse } from "./base_response";

export class InternalServer extends BaseResponse {
    constructor(message = "Internal server error") {
      super(message, 500);
    }
  }