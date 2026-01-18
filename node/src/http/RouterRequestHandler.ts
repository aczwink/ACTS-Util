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
import jwt from "jsonwebtoken";
import { Dictionary, AbsURL, OpenAPI } from "@aczwink/acts-util-core";
import { OperationStructure } from "./OperationStructure";
import { OperationValidator, ValidatedArgs } from "./OperationValidator";
import { Request } from "./Request";
import { RequestHandler } from "./RequestHandler";
import { DataResponse } from "./Response";
import { RouterNode } from "./RouterNode";
import { OpenAPISecurityVerifier } from "./OpenAPISecurityVerifier";

export class RouterRequestHandler implements RequestHandler
{
    constructor(private apiDefinition: OpenAPI.Root, private operationToStructureMap: Dictionary<OperationStructure>, private operationToFunctionMap: Dictionary<Function>, private forceHandle: boolean = true)
    {
        this.operationMap = {};
        this.rootRouterNode = new RouterNode;

        this.ConstructRouting(apiDefinition);
    }

    //Public methods
    public async HandleRequest(request: Request): Promise<DataResponse | null>
    {
        const url = AbsURL.FromRelative(new AbsURL({
            host: request.hostName,
            path: "/",
            port: request.port,
            protocol: request.protocol as any,
            queryParams: {}
        }), request.routePath);

        const routeParams = {};
        const operationId = this.rootRouterNode.Match(url.pathSegments, request.httpMethod, routeParams);
        if(operationId !== null)
        {
            const operation = this.operationMap[operationId]!;
            const securityVerifier = new OpenAPISecurityVerifier(this.apiDefinition);
            const error = securityVerifier.Verify(request.headers.authorization, operation);
            if(error !== undefined)
            {
                return {
                    statusCode: 401,
                    headers: {
                        "Content-Type": {
                            mediaType: "text/html",
                            charset: "utf-8"
                        }
                    },
                    data: "Authorization failed because of: " + error
                };
            }


            const operationValidator = new OperationValidator(this.apiDefinition, operation);
            const validatedArgs = operationValidator.Validate(routeParams, url.queryParams, request.body);
            if(validatedArgs instanceof Error)
            {
                return {
                    statusCode: 400,
                    headers: {
                        "Content-Type": {
                            mediaType: "text/html",
                            charset: "utf-8"
                        }
                    },
                    data: "Validation error: " + validatedArgs.message
                };
            }

            const args = this.ExtractArgs(validatedArgs, request, this.operationToStructureMap[operationId]!);
            try
            {
                const func = this.operationToFunctionMap[operationId];
                if(func === undefined)
                    throw new Error("no function registered for operation: " + operationId);

                const result = await func.call(undefined, ...args);
                return this.WrapResult(result);
            }
            catch(e)
            {
                console.error("Unhandled exception occured: ", e);
                return {
                    statusCode: 500,
                    headers: {
                        "Content-Type": {
                            mediaType: "text/html",
                            charset: "utf-8"
                        }
                    },
                    data: "Internal server error"
                };
            }
        }

        if(!this.forceHandle)
            return null;

        return {
            statusCode: 404,
            headers: {
                "Content-Type": {
                    mediaType: "text/html",
                    charset: "utf-8"
                }
            },
            data: "Unknown route: " + url.path
        };
    }

    //Private variables
    private rootRouterNode: RouterNode;
    private operationMap: Dictionary<OpenAPI.Operation>;

    //Private methods
    private ConstructRouting(apiDefinition: OpenAPI.Root)
    {
        for (const key in apiDefinition.paths)
        {
            if (Object.prototype.hasOwnProperty.call(apiDefinition.paths, key))
            {
                const pathItem = apiDefinition.paths[key]!;

                this.ConstructRoutingOperation(key, "DELETE", pathItem.delete);
                this.ConstructRoutingOperation(key, "GET", pathItem.get);
                this.ConstructRoutingOperation(key, "PATCH", pathItem.patch);
                this.ConstructRoutingOperation(key, "POST", pathItem.post);
                this.ConstructRoutingOperation(key, "PUT", pathItem.put);
            }
        }
    }

    private ConstructRoutingOperation(path: string, operationMethod: string, operation: OpenAPI.Operation | undefined)
    {
        if(operation === undefined)
            return;

        this.rootRouterNode.Map(path, operationMethod, operation.operationId);
        this.operationMap[operation.operationId] = operation;
    }

    private ExtractArgs(validatedArgs: ValidatedArgs, request: Request, opStruct: OperationStructure)
    {
        return opStruct.parameters.map(ps => {
            switch(ps.source)
            {
                case "body":
                    return validatedArgs.body;
                case "body-prop":
                    return validatedArgs.body[ps.name];
                case "header":
                    return request.headers[ps.name.toLowerCase()];
                case "header-auth-bearer-jwt":
                    return jwt.decode(request.headers.authorization!.substring("Bearer ".length), { json: true })
                case "path":
                    return validatedArgs.routeParams[ps.name];
                case "query":
                    return validatedArgs.queryParams[ps.name];
                case "request":
                    return request;
            }
        });
    }

    private WrapResult(result: any): DataResponse
    {
        if(result === undefined)
        {
            return {
                statusCode: 204,
                headers: {},
                data: {}
            };
        }

        if(typeof result.statusCode === 'number')
            return result as DataResponse;

        return {
            statusCode: 200,
            headers: {},
            data: result
        };
    }
}