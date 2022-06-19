/**
 * ACTS-Util
 * Copyright (C) 2022 Amir Czwink (amir130@hotmail.de)
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

import { HTTPMethod } from "./APIRegistry";

export interface ResponseMetadata
{
    statusCode: number;
    schemaName: string;
}

export interface ParameterMetadata
{
    name: string;
    source: "body" | "body-prop" | "form-field" | "path" | "query" | "request";
    schemaName: string;
    required: boolean;
}

export interface OperationMetadata
{
    route?: string;
    httpMethod: HTTPMethod;
    methodName: string;
    parameters: ParameterMetadata[];
    responses: ResponseMetadata[];
}

export interface APIControllerMetadata
{
    baseRoute: string;
    operations: OperationMetadata[];
}