import { HTTP } from 'acts-util-node';
/**
 * ACTS-Util
 * Copyright (C) 2020-2022 Amir Czwink (amir130@hotmail.de)
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
import { APIRegistryInstance, APIRegistryInterface } from './APIRegistry';
import { APIController, Body, BodyProp, Delete, FormField, Get, Path, Post, Put, Query } from './decorators';

export const APIRegistry: APIRegistryInterface = APIRegistryInstance;

type TypedHTTPResponse<StatusCodeNumber extends number, DataType> = {
    statusCode: StatusCodeNumber;
    headers: HTTP.ResponseHeaders;
    data: DataType;
};

export {
    APIController,
    Body,
    BodyProp,
    Delete,
    FormField,
    Get,
    Path,
    Post,
    Put,
    Query,
};

export function NotFound(errorMessage: string): TypedHTTPResponse<404, string>
{
    return {
        statusCode: 404,
        headers: {
            "Content-Type": "text/html; charset=utf-8",
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