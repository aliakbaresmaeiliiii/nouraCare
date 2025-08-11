export class BaseResponse extends Error {
  public code: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.message = message;
    this.code = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
