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

import { Dictionary } from "acts-util-core";

export interface Reference
{
    $ref: string;
}

interface ArraySchema
{
    type: "array";
    items: Schema | Reference;
}

interface BooleanSchema
{
    type: "boolean";
}

interface NumberSchema
{
    type: "number";
    enum?: number[];
}

interface ObjectSchema
{
    type: "object";
    properties: Dictionary<Schema | Reference>;
    required: string[];
    additionalProperties: boolean;
}

interface StringSchema
{
    type: "string";
    enum?: string[];
    format?: "binary";
}

export type Schema = ArraySchema | BooleanSchema | NumberSchema | ObjectSchema | StringSchema;

interface Components
{
    schemas: Dictionary<Schema>;
}

interface Info
{
    title: string;
    version: string;
}

export interface Parameter
{
    name: string;
    in: "path" | "query";
    required?: boolean;
    schema: Schema;
}

export interface MediaType
{
    schema?: Schema | Reference;
}

export interface RequestBody
{
    required?: boolean;
    content: Dictionary<MediaType>;
}

export interface Response
{
    description: string;
    content?: Dictionary<MediaType>;
}

export interface Operation
{
    operationId: string;
    parameters: Parameter[];
    requestBody?: RequestBody;
    responses: Dictionary<Response>;
}

export interface PathItem
{
    delete?: Operation;
    get?: Operation;
    post?: Operation;
    put?: Operation;
}

export type Paths = Dictionary<PathItem>;

export interface Root
{
    components: Components;
    openapi: "3.0.0";
    info: Info;
    paths: Paths;
}