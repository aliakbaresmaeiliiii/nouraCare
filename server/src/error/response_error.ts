import {BaseResponse} from './base_response';
import {InternalServer} from './internal_server';
import {Unauthorized} from './unauthorized';
import {Forbidden} from './forbidden';
import {NotFound} from './not_found';
import {BadRequest} from './bad_request';

export const ResponseError = {
    BaseResponse,
    BadRequest,
    NotFound,
    Forbidden,
    Unauthorized,
    InternalServer,
}

