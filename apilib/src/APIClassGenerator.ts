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
import fs from "fs";
import { Dictionary, OpenAPI } from "acts-util-core";
import { EnumeratorBuilder } from "acts-util-core/dist/Enumeration/EnumeratorBuilder";
import { APIPathNode } from "./APIPathNode";

interface BodyParam
{
    name: string;
    schema: OpenAPI.Schema | OpenAPI.Reference;
}
interface Body
{
    contentType: string;
    params: string;
}

interface FormatRule
{
    format: "date-time";
    keys: string[];
}

interface ResponseType
{
    returnTypeName: string;
    returnTypeSchema:OpenAPI.Schema | OpenAPI.Reference;
    format: "blob" | "json";
}

interface ResponseTypeWithStatusCode extends ResponseType
{
    statusCode: number;
}

export class APIClassGenerator
{
    constructor(private excludedStatusCodes: Set<number>)
    {
    }

    //Public methods
    public async Generate(sourcePath: string, destPath: string, header?: string)
    {
        const openAPIDef: OpenAPI.Root = JSON.parse(await fs.promises.readFile(sourcePath, "utf-8"));

        const apiSourceCode = this.GenerateSourceCode(openAPIDef);
        const finalSourceCode = (header === undefined) ? apiSourceCode : (header + "\n\n" + apiSourceCode);
        await fs.promises.writeFile(destPath, finalSourceCode, "utf-8");
    }

    //Private methods
    private BuildFormatRules(schema: OpenAPI.Schema | OpenAPI.Reference, schemas: Dictionary<OpenAPI.Schema>, indention: number)
    {
        const rules = this.FindFormatRules([], schema, schemas);

        return "[\n"
            + (
                rules.Map(x => this.Indent(indention + 1) + "{ format: '" + x.format + "', keys: [" + x.keys.Values().Map(k => "'" + k + "'").Join(", ") + "] }")
            ).Join(",\n")
            + "\n" + this.Indent(indention) + "]";
    }

    private DeclarationToSourceCode(name: string, required: boolean, schema: OpenAPI.Schema | OpenAPI.Reference, indention: number)
    {
        const formattedName = name.includes(" ") ? '"' + name + '"' : name;
        return formattedName + (required ? "" : "?") + ": " + this.SchemaToTypeName(schema, indention)
    }

    private ExtractBodyParams(requestBody: OpenAPI.RequestBody | undefined): Body
    {
        if(requestBody !== undefined)
        {
            for (const key in requestBody.content)
            {
                if (Object.prototype.hasOwnProperty.call(requestBody.content, key))
                {
                    const value = requestBody.content[key]!.schema!;

                    if("$ref" in value)
                    {
                        return {
                            contentType: key,
                            params: this.GenerateSchemaSourceCode(value)
                        };
                    }

                    if(("anyOf" in value) || ("oneOf" in value))
                        throw new Error("not implemented");

                    if(value.type === "object")
                    {
                        return {
                            contentType: key,
                            params: "{ " + value.properties.Entries()
                                .Map(kv => kv.key + ": " + this.GenerateSchemaSourceCode(kv.value!))
                                .Join("; ")
                                + " }"
                        };
                    }
                }
            }
        }

        return {
            contentType: "",
            params: ""
        };
    }

    private FindFormatRules(keys: string[], schema: OpenAPI.Schema | OpenAPI.Reference, schemas: Dictionary<OpenAPI.Schema>): EnumeratorBuilder<FormatRule>
    {
        if("$ref" in schema)
        {
            const refSchema = schemas[schema.$ref.split("/").pop()!]!;
            return this.FindFormatRules(keys, refSchema, schemas);
        }
        if("anyOf" in schema)
        {
            //return schema.anyOf.Values().Map(x => this.FindFormatRules(keys, x, schemas)).Flatten();
            //TODO: implement this
            const empty: FormatRule[] = [];
            return empty.Values();
        }
        if("oneOf" in schema)
        {
            const empty: FormatRule[] = [];
            return empty.Values();
        }

        switch(schema.type)
        {
            case "array":
                return this.FindFormatRules(keys, schema.items, schemas);
            case "boolean":
            case "number":
                break;
            case "object":
                return schema.properties.Entries()
                    .Map(kv => this.FindFormatRules([...keys, kv.key] as string[], kv.value!, schemas) ).Flatten();
            case "string":
                if(schema.format === "date-time")
                {
                    const rule: FormatRule = {
                        format: "date-time",
                        keys
                    };
                    return [rule].Values();
                }
                break;
        }

        const empty: FormatRule[] = [];
        return empty.Values();
    }

    private FindResponseType(responses: Dictionary<OpenAPI.Response>)
    {
        const successfulCodes: ResponseTypeWithStatusCode[] = [];
        for (const key in responses)
        {
            if (Object.prototype.hasOwnProperty.call(responses, key))
            {
                const response = responses[key]!;

                if((Math.floor(parseInt(key) / 100) == 2))
                {
                    if(response.content === undefined)
                    {
                        successfulCodes.push({
                            statusCode: parseInt(key),
                            format: "json",
                            returnTypeName: "void",
                            returnTypeSchema: {
                                type: "object",
                                properties: {},
                                required: [],
                                additionalProperties: false
                            }
                        });
                        continue;
                    }

                    for (const key2 in response.content)
                    {
                        if (Object.prototype.hasOwnProperty.call(response.content, key2))
                        {
                            const mediaType = response.content[key2]!;
                            const responseType = this.FindResponseTypeFromMediaType(mediaType);
                            successfulCodes.push({
                                statusCode: parseInt(key),
                                ...responseType
                            });
                        }
                    }
                }
            }
        }

        return successfulCodes.Values().OrderBy(x => x.statusCode).First();
    }

    private FindResponseTypeFromMediaType(mediaType: OpenAPI.MediaType): ResponseType
    {
        if(mediaType.schema === undefined)
        {
            return {
                returnTypeName: "Blob",
                format: "blob",
                returnTypeSchema: {
                    type: "object",
                    properties: {},
                    required: [],
                    additionalProperties: false
                }
            };
        }

        return {
            returnTypeName: this.GenerateSchemaSourceCode(mediaType.schema),
            returnTypeSchema: mediaType.schema,
            format: "json",
        };
    }

    private GenerateAPIClass(paths: OpenAPI.Paths, schemas: Dictionary<OpenAPI.Schema>)
    {
        const constructorDef = "constructor(private __issueRequest: (requestData: RequestData) => Promise<RawResponse>){}";
        return "export abstract class API\n{\n\t" + constructorDef + "\n\n" + this.GenerateAPIObjects(paths, schemas) + "\n}";
    }

    private GenerateAPIDefinition(path: string, pathItem: OpenAPI.PathItem, schemas: Dictionary<OpenAPI.Schema>, indention: number)
    {
        const parts = [
            this.GenerateAPIDefinitionForOperation("delete", path, pathItem.delete, schemas, indention),
            this.GenerateAPIDefinitionForOperation("get", path, pathItem.get, schemas, indention),
            this.GenerateAPIDefinitionForOperation("patch", path, pathItem.patch, schemas, indention),
            this.GenerateAPIDefinitionForOperation("post", path, pathItem.post, schemas, indention),
            this.GenerateAPIDefinitionForOperation("put", path, pathItem.put, schemas, indention),
        ];

        return parts.Values().Filter(x => x.length > 0).Join("\n");
    }
    
    private GenerateAPIDefinitionForOperation(operationName: string, path: string, operation: OpenAPI.Operation | undefined, schemas: Dictionary<OpenAPI.Schema>, indention: number)
    {
        if(operation === undefined)
            return "";

        const responseType = this.FindResponseType(operation.responses);
        const errStatusCodes = operation.responses.OwnKeys().Map(x => x.toString())
            .Filter(x => x !== responseType.statusCode.toString())
            .Filter(x => !this.excludedStatusCodes.has(parseInt(x)))
            .Join(" | ");
        const errStatusCodesType = errStatusCodes.length == 0 ? "undefined" : errStatusCodes;
        const optTypeCast = errStatusCodes.length == 0 ? " as Promise<SuccessResponse<" + responseType.statusCode + ", " + responseType.returnTypeName + ">>" : " as Promise<ResponseData<" + responseType.statusCode + ", " + errStatusCodesType + ", " + responseType.returnTypeName + ">>";

        const queryParams = operation.parameters.Values().Filter(x => x.in === "query");
        const queryParamsArgString = queryParams.Any() ? "query: { " + (queryParams.Map(this.ParameterToSourceCode.bind(this))).Join("; ") + " }" : "";

        const pathParams = operation.parameters.Values().Filter(x => x.in === "path");
        const pathParamsArgString = pathParams.Any() ? (pathParams.Map(x => x.name + ": " + this.GenerateSchemaSourceCode(x.schema))).Join(", ") : "";

        const bodyParam = this.ExtractBodyParams(operation.requestBody);
        const isFormData = bodyParam.contentType === "multipart/form-data";
        const hasBody = bodyParam.params.length > 0;
        const bodyParamsArgString = hasBody ? "body: " + bodyParam.params : "";

        const argString = [pathParamsArgString, queryParamsArgString, bodyParamsArgString, "opt?: OptionalRequestData"].Values().Filter(x => x.length > 0).Join(", ");

        const subIndention = indention + 2;
        const requestParamObjectString = "{\n"
            + this.Indent(subIndention) + "path: `" + path.ReplaceAll("{", "${encodeURIComponent(").ReplaceAll("}", ")}") + "`,\n"
            + this.Indent(subIndention) + "method: '" + operationName.toUpperCase() + "',\n"
            + this.Indent(subIndention) + "responseType: '" + responseType.format + "',\n"
            + this.Indent(subIndention) + "successStatusCode: " + responseType.statusCode + ",\n"
            + this.Indent(subIndention) + "formatRules: " + this.BuildFormatRules(responseType.returnTypeSchema, schemas, subIndention) + ",\n"
            + (queryParams.Any() ? (this.Indent(subIndention) + "query,\n") : "")
            + (hasBody ? (this.Indent(subIndention) + "body,\n") : "")
            + (isFormData ? (this.Indent(subIndention) + "requestBodyType: 'form-data',\n") : "")
            + this.Indent(subIndention) + "...opt,\n"
            + this.Indent(indention+1) + "}";

        return this.Indent(indention) + operationName + ": (" + argString + ") =>\n" + this.Indent(indention +1) + "this.__issueRequest(" + requestParamObjectString + ")" + optTypeCast + ",";
    }

    private GenerateAPIObject(pathSegment: string, node: APIPathNode, schemas: Dictionary<OpenAPI.Schema>)
    {
        const path = "/" + pathSegment;
        const segmentName = pathSegment.ReplaceAll("/", "").ReplaceAll("-", "");
        const apiDefs = (node.pathItem === undefined) ? "" : this.GenerateAPIDefinition(path, node.pathItem, schemas, 2);
        const subObjects = node.children
            .Map(kv => this.GenerateAPISubObject(kv.key.toString(), kv.value!, schemas, 2, path))
            .Join("\n");
        const content = [apiDefs, subObjects].filter(x => x.length > 0).join("\n\n");
        return "\t" + segmentName + " = {\n" + content + "\n\t};";
    }

    private GenerateAPIObjects(paths: OpenAPI.Paths, schemas: Dictionary<OpenAPI.Schema>)
    {
        const root = new APIPathNode();
        paths.Entries().ForEach(x => root.Add(x.key.toString().substring(1).split("/"), x.value!));

        return root.children
            .Map(kv => this.GenerateAPIObject(kv.key.toString(), kv.value!, schemas))
            .Join("\n");
    }

    private GenerateAPISubObject(pathSegment: string, node: APIPathNode, schemas: Dictionary<OpenAPI.Schema>, indention: number, parentPath: string): string
    {
        const subPath = parentPath + "/" + (pathSegment === "*" ? node.wildCardName : pathSegment);

        const segmentName = (pathSegment === "*") ? "_any_" : pathSegment.ReplaceAll("/", "").ReplaceAll("-", "");
        const apiDefs = (node.pathItem === undefined) ? "" : this.GenerateAPIDefinition(subPath, node.pathItem, schemas, indention + 1);
        const subObjects = node.children
            .Map(kv => this.GenerateAPISubObject(kv.key.toString(), kv.value!, schemas, indention + 1, subPath))
            .Join("\n");
            const content = [apiDefs, subObjects].filter(x => x.length > 0).join("\n\n");

        return this.Indent(indention) + segmentName + ": {\n" + content + "\n" + this.Indent(indention) + "},";
    }

    private GenerateModelSourceCode(modelName: string, schema: OpenAPI.Schema)
    {
        if(("anyOf" in schema) || ("oneOf" in schema))
            return "export type " + modelName + " = " + this.SchemaToTypeName(schema, 0) + ";";

        if(schema.type === "number")
        {
            const entries = [];
            for(let i = 0; i < schema.enum!.length; i++)
            {
                const k = (schema as any)["x-enum-varnames"][i];
                entries.push("\t" + k + " = " + schema.enum![i]);
            }
            return "export enum " + modelName + "\n{\n" + entries.join(",\n") + "\n};";
        }
        if(schema.type === "string")
            return "export type " + modelName + " = " + schema.enum!.Values().Map(x => '"' + x + '"').Join(" | ") + ";";
        return "export interface " + modelName + "\n" + this.GenerateSchemaSourceCode(schema);
    }

    private GenerateModelsSourceCode(schemas: Dictionary<OpenAPI.Schema>)
    {
        return schemas.Entries().Map(kv => this.GenerateModelSourceCode(kv.key.toString(), kv.value!)).Join("\n\n");
    }

    private GenerateRequestDataInterfaceSourceCode()
    {
        return `
interface FormatRule
{
    format: "date-time";
    keys: string[];
}

interface RequestData extends OptionalRequestData
{
    path: string;
    method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
    query?: object;
    body?: object;
    requestBodyType?: "form-data";
    responseType: "blob" | "json";
    successStatusCode: number;
    formatRules: FormatRule[];
}

interface RawResponse
{
    statusCode: number;
    data: any;
    rawBody: any;
}

interface ErrorResponse<StatusCodeType>
{
	statusCode: StatusCodeType;
    rawBody: any;
}

interface SuccessResponse<StatusCodeType, DataType>
{
	statusCode: StatusCodeType;
    data: DataType;
    rawBody: any;
}

export type ResponseData<SuccessStatusCodeType, ErrorStatusCodeType, DataType> =
    ErrorResponse<ErrorStatusCodeType> | SuccessResponse<SuccessStatusCodeType, DataType>;
        `;
    }

    private GenerateSchemaSourceCode(schema: OpenAPI.Schema | OpenAPI.Reference): string
    {
        return this.SchemaToTypeName(schema, 0);
    }

    private GenerateSourceCode(openAPIDef: OpenAPI.Root)
    {
        return this.GenerateModelsSourceCode(openAPIDef.components.schemas)
            + "\n\n"
            + this.GenerateRequestDataInterfaceSourceCode()
            + "\n\n"
            + this.GenerateAPIClass(openAPIDef.paths, openAPIDef.components.schemas);
    }

    private Indent(indention: number): string
    {
        if(indention == 0)
            return "";
        return "\t" + this.Indent(indention - 1);
    }

    private ParameterToSourceCode(parameter: OpenAPI.Parameter)
    {
        return this.DeclarationToSourceCode(parameter.name, parameter.required === true, parameter.schema, 0);
    }

    private SchemaToTypeName(schema: OpenAPI.Schema | OpenAPI.Reference, indention: number): string
    {
        if("$ref" in schema)
            return schema.$ref.split("/").pop()!;

        if("anyOf" in schema)
            return schema.anyOf.map(x => this.SchemaToTypeName(x, indention)).join(" | ");
        if("oneOf" in schema)
            return schema.oneOf.map(x => this.SchemaToTypeName(x, indention)).join(" | ");

        switch(schema.type)
        {
            case "array":
                return this.SchemaToTypeName(schema.items, indention) + "[]";
            case "boolean":
                return "boolean";
            case "number":
                return "number";
            case "'null'":
                return "null";
            case "object":
                return "{\n"
                    + schema.properties.Entries()
                    .Map(kv => this.Indent(indention + 1) + this.DeclarationToSourceCode(kv.key.toString(), schema.required.Contains(kv.key), kv.value!, indention + 1) + ";")
                    .Join("\n")
                    + "\n" + this.Indent(indention) + "}";
            case "string":
                if(schema.enum !== undefined)
                    return schema.enum.Values().Map(x => '"' + x + '"').Join(" | ");
                if(schema.format === "binary")
                    return "File";
                if(schema.format === "date-time")
                    return "Date";
                return "string";
        }
    }
}