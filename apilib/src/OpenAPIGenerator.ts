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
import { OpenAPI } from "acts-util-node";
import { APIRegistryInstance } from "./APIRegistry";
import { APIControllerMetadata, ParameterMetadata, ResponseMetadata } from "./Metadata";
import { TypeCatalog, TypeOrRef } from "./TypeCatalog";

export interface SecuritySchemeDef extends OpenAPI.SecurityScheme
{
    global: boolean;
}

export class OpenAPIGenerator
{
    constructor(private typeCatalog: TypeCatalog)
    {
    }

    //Public methods
    public Generate(apiControllersMetadata: APIControllerMetadata[], securitySchemes: Dictionary<SecuritySchemeDef>): OpenAPI.Root
    {
        return {
            components: {
                schemas: this.CreateSchemas(),
                securitySchemes: securitySchemes.Entries().ToDictionary(kv => kv.key, kv => ({
                    type: kv.value!.type,
                    scheme: kv.value!.scheme
                }))
            },
            info: {
                title: "TODO", //TODO
                version: "TODO" //TODO
            },
            openapi: "3.0.0",
            paths: this.CreatePathsObject(apiControllersMetadata),
            security: securitySchemes.Entries().Filter(kv => kv.value!.global).Map(kv => ({ [kv.key]: [] })).ToArray()
        };
    }

    //Private methods
    private CreateParameters(parameters: ParameterMetadata[]): OpenAPI.Parameter[]
    {
        const otherParams = ["body", "body-prop", "form-field", "header", "request"];
        return parameters.Values()
            .Filter(x => !otherParams.Contains(x.source))
            .Map(param => ({
                in: param.source as any,
                name: param.name,
                required: param.required,
                schema: this.CreateSchemaOrReference(param.schemaName) as OpenAPI.Schema //TODO: check this, a ref is not allowed for a parameter?
        })).ToArray();
    }

    private CreatePathsObject(apiControllersMetadata: APIControllerMetadata[])
    {
        const obj: OpenAPI.Paths = {};

        for (const apiControllerMetadata of apiControllersMetadata)
        {
            for (const operation of apiControllerMetadata.operations)
            {
                const route = apiControllerMetadata.baseRoute + (operation.route === undefined ? "" : "/" + operation.route);
                if(!(route in obj))
                    obj[route] = {};
                
                const ops = obj[route] as Dictionary<OpenAPI.Operation>;
                ops[operation.httpMethod.toLowerCase()] = {
                    operationId: APIRegistryInstance.GenerateOperationId(route, operation.httpMethod),
                    parameters: this.CreateParameters(operation.parameters),
                    requestBody: this.CreateRequestBody(operation.parameters),
                    responses: this.CreateResponses(operation.responses),
                    security: (operation.security === undefined) ? undefined : (operation.security.map(k => ({ [k]: [] }) )),
                };
            }
        }

        return obj;
    }

    private CreateRequestBody(parameters: ParameterMetadata[]): OpenAPI.RequestBody | undefined
    {
        const formBodyParams = parameters.filter(x => x.source === "form-field");
        const jsonBodyParams = parameters.filter(x => x.source === "body-prop");
        const fullJsonBodyParams = parameters.filter(x => x.source === "body");
        if((formBodyParams.length === 0) && (jsonBodyParams.length === 0) && (fullJsonBodyParams.length === 0))
            return undefined;

        if(formBodyParams.length > 0)
        {
            if((jsonBodyParams.length + fullJsonBodyParams.length) > 0)
                throw new Error("Can't mix formdata and json in body");

            return {
                required: true,
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                            properties: formBodyParams.Values().ToDictionary(kv => kv.name, kv => this.CreateSchemaOrReference(kv.schemaName)),
                            required: formBodyParams.map(x => x.name),
                            additionalProperties: false
                        }
                    }
                }
            };
        }

        if(fullJsonBodyParams.length === 1)
        {
            if(jsonBodyParams.length > 0)
                throw new Error("Can't use BodyProp when using Body");

            return {
                required: true,
                content: {
                    "application/json": {
                        schema: this.CreateSchemaOrReference(fullJsonBodyParams[0].schemaName)
                    }
                }
            };
        }
        else if(fullJsonBodyParams.length > 0)
            throw new Error("Body can only be used once");

        return {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: jsonBodyParams.Values().ToDictionary(kv => kv.name, kv => this.CreateSchemaOrReference(kv.schemaName)),
                        required: jsonBodyParams.map(x => x.name),
                        additionalProperties: false
                    }
                }
            }
        };
    }

    private CreateResponseContent(response: ResponseMetadata): Dictionary<OpenAPI.MediaType> | undefined
    {
        if(response.statusCode == 204)
            return undefined;

        if(response.schemaName === "Buffer")
        {
            return {
                "application/octet-stream": {
                }
            };
        }
            
        return {
            "application/json": {
                schema: this.CreateSchemaOrReference(response.schemaName)
            }
        };
    }

    private CreateSchema(schemaName: string): OpenAPI.Schema
    {
        return this.CreateSchemaOrReference(this.typeCatalog.GetNamedType(schemaName)) as any;
    }

    private CreateSchemaOrReference(typeOrRef: TypeOrRef): OpenAPI.Schema | OpenAPI.Reference
    {
        if(typeof typeOrRef !== "string")
        {
            switch(typeOrRef.kind)
            {
                case "array":
                    return {
                        type: "array",
                        items: this.CreateSchemaOrReference(typeOrRef.entryType)
                    };
                case "enum":
                    if(typeOrRef.schema.underlyingType === "number")
                    {
                        return {
                            type: "number",
                            enum: typeOrRef.schema.values,
                            "x-enum-varnames": typeOrRef.schema.names
                        } as any;
                    }
                    return {
                        type: typeOrRef.schema.underlyingType,
                        enum: typeOrRef.schema.values
                    };
                case "object":
                    const props = typeOrRef.properties.Values();
                    return {
                        type: "object",
                        properties: props.ToDictionary(kv => kv.propertyName, kv => this.CreateSchemaOrReference(kv.type)),
                        required: props.Filter(prop => prop.required).Map(prop => prop.propertyName).ToArray(),
                        additionalProperties: false,
                    };
                case "union":
                    return {
                        anyOf: typeOrRef.subTypes.map(this.CreateSchemaOrReference.bind(this))
                    };
            }
            console.error(typeOrRef);
            throw new Error("todo");
        }

        switch(typeOrRef)
        {
            case "boolean":
                return {
                    type: "boolean"
                };
            case "Date":
                return {
                    type: "string",
                    format: "date-time"
                };
            case "number":
                return {
                    type: "number"
                };
            case "string":
                return {
                    type: "string"
                };
            case "UploadedFile":
                return {
                    type: "string",
                    format: "binary"
                };
        }

        return {
            $ref: "#/components/schemas/" + typeOrRef
        };
    }

    private CreateResponseObject(response: ResponseMetadata): OpenAPI.Response
    {
        return {
            description: "TODO",
            content: this.CreateResponseContent(response)
        };
    }

    private CreateResponses(responses: ResponseMetadata[]): Dictionary<OpenAPI.Response>
    {
        return responses.Values().ToDictionary(x => x.statusCode, this.CreateResponseObject.bind(this));
    }

    private CreateSchemas(): Dictionary<OpenAPI.Schema>
    {
        return this.typeCatalog.namedTypes
            .ToDictionary(k => k, this.CreateSchema.bind(this));
    }
}