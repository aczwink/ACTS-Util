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

export interface ResponseHeaders
{
    "Content-Type"?: "image/gif" | "text/html; charset=utf-8";
}

interface Response
{
    statusCode: number;
    headers: ResponseHeaders;
}

export interface ObjectResponse<T> extends Response
{
    data: T;
}

export interface RawResponse extends Response
{
    data: Buffer;
}

export type DataResponse = ObjectResponse<object> | ObjectResponse<string> | RawResponse;