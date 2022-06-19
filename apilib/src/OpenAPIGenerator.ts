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
import { TypeCatalog } from "./TypeCatalog";

export class OpenAPIGenerator
{
    constructor(private typeCatalog: TypeCatalog)
    {
    }

    //Public methods
    public Generate(apiControllersMetadata: APIControllerMetadata[]): OpenAPI.Root
    {
        return {
            components: {
                schemas: this.CreateSchemas()
            },
            info: {
                title: "TODO", //TODO
                version: "TODO" //TODO
            },
            openapi: "3.0.0",
            paths: this.CreatePathsObject(apiControllersMetadata)
        };
    }

    //Private methods
    private CreateParameters(parameters: ParameterMetadata[]): OpenAPI.Parameter[]
    {
        const otherParams = ["body", "body-prop", "form-field", "request"];
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
                    responses: this.CreateResponses(operation.responses)
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
    private CreateSchemaOrReference(schemaName: string): OpenAPI.Schema | OpenAPI.Reference
    {
        switch(schemaName)
        {
            case "boolean":
                return {
                    type: "boolean"
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

        if(schemaName.endsWith("[]"))
        {
            return {
                type: "array",
                items: this.CreateSchemaOrReference(schemaName.slice(0, -2))
            };
        }

        if(schemaName.startsWith("<"))
        {
            const end = schemaName.indexOf(">");
            return {
                type: schemaName.substring(1, end) as "number" | "string",
                enum: JSON.parse(schemaName.substr(end+1))
            };
        }

        return {
            $ref: "#/components/schemas/" + schemaName
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

    private CreateSchema(schemaName: string): OpenAPI.Schema
    {
        switch(schemaName)
        {
            case "number":
                return {
                    type: "number"
                };
            case "string":
                return {
                    type: "string"
                };
        }

        const enumProps = this.typeCatalog.GetEnumProperties(schemaName);
        if(enumProps !== undefined)
        {
            if(enumProps.underlyingType === "number")
            {
                return {
                    type: "number",
                    enum: enumProps.values,
                    "x-enum-varnames": enumProps.names
                } as any;
            }
            return {
                type: enumProps.underlyingType,
                enum: enumProps.values
            };
        }

        const props = this.typeCatalog.GetSchemaProperties(schemaName);
        return {
            type: "object",
            properties: props.ToDictionary(kv => kv.propertyName, kv => this.CreateSchemaOrReference(kv.schemaName)),
            required: props.Filter(prop => prop.required).Map(prop => prop.propertyName).ToArray(),
            additionalProperties: false,
        };
    }

    private CreateSchemas(): Dictionary<OpenAPI.Schema>
    {
        return this.typeCatalog.namedTypes
            .ToDictionary(k => k, k => this.CreateSchema(k.toString()));
    }
}