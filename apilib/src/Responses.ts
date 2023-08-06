/**
 * ACTS-Util
 * Copyright (C) 2020-2023 Amir Czwink (amir130@hotmail.de)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * */
import { HTTP } from 'acts-util-node';

type TypedHTTPResponse<StatusCodeNumber extends number, DataType> = {
    statusCode: StatusCodeNumber;
    headers: HTTP.ResponseHeaders;
    data: DataType;
};

export function BadRequest(errorMessage: string): TypedHTTPResponse<400, string>
{
    return {
        statusCode: 400,
        headers: {
            "Content-Type": {
                mediaType: "text/html",
                charset: "utf-8"
            }
        },
        data: errorMessage
    };
}

export function Forbidden(errorMessage: string): TypedHTTPResponse<403, string>
{
    return {
        statusCode: 403,
        headers: {
            "Content-Type": {
                mediaType: "text/html",
                charset: "utf-8"
            }
        },
        data: errorMessage
    };
}

export function Conflict(errorMessage: string): TypedHTTPResponse<409, string>
{
    return {
        statusCode: 409,
        headers: {
            "Content-Type": {
                mediaType: "text/html",
                charset: "utf-8"
            }
        },
        data: errorMessage
    };
}

export function InternalServerError(errorMessage: string): TypedHTTPResponse<500, string>
{
    return {
        statusCode: 500,
        headers: {
            "Content-Type": {
                mediaType: "text/html",
                charset: "utf-8"
            }
        },
        data: errorMessage
    };
}

export function NotFound(errorMessage: string): TypedHTTPResponse<404, string>
{
    return {
        statusCode: 404,
        headers: {
            "Content-Type": {
                mediaType: "text/html",
                charset: "utf-8"
            }
        },
        data: errorMessage
    };
}

export function Ok<T>(data: T, headers: HTTP.ResponseHeaders): TypedHTTPResponse<200, T>
{
    return {
        statusCode: 200,
        headers,
        data,
    };
}

export function Unauthorized(errorMessage: string): TypedHTTPResponse<401, string>
{
    return {
        statusCode: 401,
        headers: {
            "Content-Type": {
                mediaType: "text/html",
                charset: "utf-8"
            }
        },
        data: errorMessage
    };
}