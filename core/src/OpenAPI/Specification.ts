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

import { Dictionary } from "../Dictionary";

export interface Reference
{
    $ref: string;
    description?: string;
    title?: string; //TODO: THIS IS NONSTANDARD!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
}

interface SchemaBase
{
    description?: string;
    title?: string;
}
interface PrimitiveSchemaBase extends SchemaBase
{
    format?: string;
}

interface ArraySchema extends SchemaBase
{
    type: "array";
    items: Schema | Reference;
}

interface AnyOfSchema
{
    anyOf: (Schema | Reference)[];
}

interface BooleanSchema extends PrimitiveSchemaBase
{
    type: "boolean";
    default?: boolean;
}

export interface NumberSchema extends PrimitiveSchemaBase
{
    type: "number";
    default?: number;
    enum?: number[];
    minimum?: number;
    maximum?: number;
}

export interface ObjectSchema extends SchemaBase
{
    type: "object";
    properties: Dictionary<Schema | Reference>;
    required: string[];
    additionalProperties: boolean;
}

interface OneOfSchema
{
    oneOf: (Schema | Reference)[];
    discriminator?: {
        propertyName: string;
    }
}

export interface StringSchema extends PrimitiveSchemaBase
{
    type: "string";
    enum?: string[];
    format?: "binary" | "date-time";
    pattern?: string;
}

export type Schema = AnyOfSchema | ArraySchema | BooleanSchema | NumberSchema | ObjectSchema | OneOfSchema | StringSchema;

interface HTTPSecurityScheme
{
    type: "http";
    scheme: string;
}

export type SecurityScheme = HTTPSecurityScheme;

interface Components
{
    schemas: Dictionary<Schema>;
    securitySchemes: Dictionary<SecurityScheme>;
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

type SecurityRequirement = Dictionary<string[]>;

export interface Operation
{
    operationId: string;
    parameters: Parameter[];
    requestBody?: RequestBody;
    responses: Dictionary<Response>;
    security?: SecurityRequirement[];
}

export interface PathItem
{
    delete?: Operation;
    get?: Operation;
    patch?: Operation;
    post?: Operation;
    put?: Operation;
}

export type Paths = Dictionary<PathItem>;

export interface Root
{
    components: Components;
    openapi: "3.1.0";
    info: Info;
    paths: Paths;
    security?: SecurityRequirement[];
}