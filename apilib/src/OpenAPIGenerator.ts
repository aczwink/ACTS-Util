/**
 * ACTS-Util
 * Copyright (C) 2022-2026 Amir Czwink (amir130@hotmail.de)
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
import { Dictionary, OpenAPI } from "@aczwink/acts-util-core";
import { APIRegistryInstance } from "./APIRegistry";
import { APIControllerMetadata, CommonMethodMetadata, ParameterMetadata, ResponseMetadata, SecurityMetadata } from "./Metadata";
import { DocumentationData, TypeCatalog, TypeOrRef } from "./TypeCatalog";
import { TypesDiscriminator } from "./TypesDiscriminator";
import { SecurityRequirement } from "@aczwink/acts-util-core/dist/OpenAPI/Specification";

export class OpenAPIGenerator
{
    constructor(private typeCatalog: TypeCatalog)
    {
    }

    //Public methods
    public Generate(apiControllersMetadata: APIControllerMetadata[], securitySchemes: Dictionary<OpenAPI.SecurityScheme>, globalSecurityRequirement?: SecurityRequirement): OpenAPI.Root
    {
        return {
            components: {
                schemas: this.CreateSchemas(apiControllersMetadata),
                securitySchemes
            },
            info: {
                title: "TODO", //TODO
                version: "TODO" //TODO
            },
            openapi: "3.1.0",
            paths: this.CreatePathsObject(apiControllersMetadata),
            security: globalSecurityRequirement
        };
    }

    //Private methods
    private CreateParameters(parameters: ParameterMetadata[]): OpenAPI.Parameter[]
    {
        const otherParams = ["auth-jwt", "body", "body-prop", "form-field", "header", "request"];
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

                this.VerifyParameters(operation.parameters, operation.methodName);

                const parameters = this.ResolveParameters(operation.parameters, apiControllerMetadata.common);
                const responses = this.ResolveResponses(operation.responses, apiControllerMetadata.common);
                
                const ops = obj[route] as Dictionary<OpenAPI.Operation>;
                ops[operation.httpMethod.toLowerCase()] = {
                    operationId: APIRegistryInstance.GenerateOperationId(route, operation.httpMethod),
                    parameters: this.CreateParameters(parameters),
                    requestBody: this.CreateRequestBody(parameters),
                    responses: this.CreateResponses(responses),
                    security: this.CreateSecurityRequirement(operation.security),
                };
            }
        }

        return obj;
    }

    private VerifyParameters(parameters: ParameterMetadata[], methodName: string)
    {
        for (let index = 0; index < parameters.length; index++)
        {
            const param = parameters[index];
            if((param.source === "common-data") && (index != 0))
                throw new Error("Common parameters must be always the first ones inside a function. Error in method: " + methodName);
        }
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

        if( (response.schemaName === "Buffer") || (response.schemaName === "Readable") )
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

    private CreateSchemaOrReference(typeOrRef: TypeOrRef, docData?: DocumentationData): OpenAPI.Schema | OpenAPI.Reference
    {
        if(typeof typeOrRef !== "string")
        {
            switch(typeOrRef.kind)
            {
                case "array":
                    return {
                        title: docData?.title,
                        description: docData?.description,
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
                        description: docData?.description,
                        enum: typeOrRef.schema.values
                    };
                case "object":
                    const props = typeOrRef.properties.Values();
                    return {
                        title: typeOrRef.docData.title,
                        type: "object",
                        properties: props.ToDictionary(kv => kv.propertyName, kv => this.CreateSchemaOrReference(kv.type, kv.docData)),
                        required: props.Filter(prop => prop.required).Map(prop => prop.propertyName).ToArray(),
                        additionalProperties: false,
                    };
                case "union":
                    const discriminatorFinder = new TypesDiscriminator(this.typeCatalog);
                    const discriminatorProperty = discriminatorFinder.FindDiscriminatorProperty(typeOrRef.subTypes);
                    if(discriminatorProperty !== null)
                    {
                        return {
                            oneOf: typeOrRef.subTypes.map(t => this.CreateSchemaOrReference(t)),
                            discriminator: {
                                propertyName: discriminatorProperty
                            }
                        };
                    }

                    return {
                        anyOf: typeOrRef.subTypes.map(t => this.CreateSchemaOrReference(t) )
                    };
            }
        }

        switch(typeOrRef)
        {
            case "boolean":
                return {
                    default: docData?.default,
                    description: docData?.description,
                    title: docData?.title,
                    type: "boolean"
                };
            case "Date":
            case "DateTime":
                return {
                    type: "string",
                    format: "date-time"
                };
            case "number":
                return {
                    default: docData?.default,
                    description: docData?.description,
                    format: docData?.format,
                    maximum: docData?.maximum,
                    minimum: docData?.minimum,
                    title: docData?.title,
                    type: "number"
                };
            case "null":
                return {
                    type: "'null'"
                };
            case "object":
                return {
                    type: "object",
                    properties: {},
                    required: [],
                    additionalProperties: true,
                };
            case "string":
                return {
                    default: docData?.default,
                    description: docData?.description,
                    format: docData?.format as any,
                    pattern: docData?.pattern,
                    title: docData?.title,
                    type: "string"
                };
            case "UploadedBlobRef":
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

    private CreateSecurityRequirement(security?: SecurityMetadata | null): OpenAPI.SecurityRequirement | undefined
    {
        if(security === undefined)
            return undefined;
        if(security === null)
            return [];
        return [
            {
                [security.securitySchemeName]: security.scopes
            }
        ];
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

    private CreateSchemas(apiControllersMetadata: APIControllerMetadata[]): Dictionary<OpenAPI.Schema>
    {
        function FlattenType(typeOrRef: TypeOrRef)
        {
            if(typeof typeOrRef !== "string")
            {
                switch(typeOrRef.kind)
                {
                    case "array":
                        return typeOrRef.entryType;
                }
            }

            return typeOrRef;
        }

        const skip = apiControllersMetadata
            .Values()
            .Map(x => x.common?.responses.find(x => x.statusCode === 200))
            .NotUndefined()
            .Map(x => x.schemaName)
            .ToSet();
        const dontSkip = apiControllersMetadata.Values()
            .Map(x => x.operations.Values()).Flatten()
            .Map(x => x.responses.Values()).Flatten()
            .Map(x => FlattenType(x.schemaName))
            .ToSet();
        const skipWithoutDontSkip = skip.Without(dontSkip);

        return this.typeCatalog.namedTypes
            .Filter(x => !skipWithoutDontSkip.has(x))
            .ToDictionary(k => k, this.CreateSchema.bind(this));
    }

    private ResolveParameters(parameters: ParameterMetadata[], common?: CommonMethodMetadata)
    {
        return parameters.Values()
            .Map(x => x.source === "common-data" ? common!.parameters : [x])
            .Map(x => x.Values())
            .Flatten()
            .Distinct(x => [x.name, x.source])
            .ToArray();
    }

    private ResolveResponses(responses: ResponseMetadata[], common?: CommonMethodMetadata)
    {
        if(common === undefined)
            return responses;

        return common.responses.Values()
            .Filter(x => x.statusCode !== 200) //everything from the common api is allowed but not its standard return value
            .Concat(responses.Values())
            .Distinct(x => x.statusCode)
            .ToArray();
    }
}