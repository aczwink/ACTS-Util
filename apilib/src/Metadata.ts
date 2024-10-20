/**
 * ACTS-Util
 * Copyright (C) 2022-2024 Amir Czwink (amir130@hotmail.de)
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
import { TypeOrRef } from "./TypeCatalog";

export interface ResponseMetadata
{
    statusCode: number;
    schemaName: TypeOrRef;
}

export interface ParameterMetadata
{
    name: string;
    source: "auth-jwt" | "body" | "body-prop" | "common-data" | "form-field" | "header" | "path" | "query" | "request";
    schemaName: TypeOrRef;
    required: boolean;
}

interface MethodMetadata
{
    methodName: string;
    parameters: ParameterMetadata[];
    responses: ResponseMetadata[];
}

export interface SecurityMetadata
{
    securitySchemeName: string;
    scopes: string[];
}

export interface CommonMethodMetadata extends MethodMetadata
{
}

export interface OperationMetadata extends MethodMetadata
{
    route?: string;
    httpMethod: HTTPMethod;
    security?: SecurityMetadata;
}

export interface APIControllerMetadata
{
    baseRoute: string;
    common?: CommonMethodMetadata;
    operations: OperationMetadata[];
}