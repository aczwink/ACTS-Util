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

import { Dictionary, URL } from "acts-util-core";
import { Operation, Root } from "../openapi/Specification";
import { OperationStructure } from "./OperationStructure";
import { OperationValidator, ValidatedArgs } from "./OperationValidator";
import { Request } from "./Request";
import { RequestHandler } from "./RequestHandler";
import { DataResponse } from "./Response";
import { RouterNode } from "./RouterNode";

export class RouterRequestHandler implements RequestHandler
{
    constructor(private apiDefinition: Root, private operationToStructureMap: Dictionary<OperationStructure>, private operationToFunctionMap: Dictionary<Function>)
    {
        this.operationMap = {};
        this.rootRouterNode = new RouterNode;

        this.ConstructRouting(apiDefinition);
    }

    //Public methods
    public async HandleRequest(request: Request): Promise<DataResponse | null>
    {
        const url = URL.FromRelative(new URL({
            authority: request.hostName + ":" + request.port,
            path: "/",
            protocol: request.protocol as any,
            queryParams: {}
        }), request.routePath);

        const routeParams = {};
        const operationId = this.rootRouterNode.Match(url.pathSegments, request.httpMethod, routeParams);
        if(operationId !== null)
        {
            const operation = this.operationMap[operationId]!;
            const operationValidator = new OperationValidator(this.apiDefinition, operation);
            const validatedArgs = operationValidator.Validate(routeParams, url.queryParams, request.body);
            if(validatedArgs instanceof Error)
            {
                return {
                    statusCode: 400,
                    headers: {
                        "Content-Type": "text/html; charset=utf-8"
                    },
                    data: "Validation error: " + validatedArgs.message
                };
            }

            const args = this.ExtractArgs(validatedArgs, this.operationToStructureMap[operationId]!);
            const result = await this.operationToFunctionMap[operationId]?.call(undefined, ...args);
            return this.WrapResult(result);
        }

        return {
            statusCode: 404,
            headers: {
                "Content-Type": "text/html; charset=utf-8"
            },
            data: "Unknown route: " + url.path
        };
    }

    //Private variables
    private rootRouterNode: RouterNode;
    private operationMap: Dictionary<Operation>;

    //Private methods
    private ConstructRouting(apiDefinition: Root)
    {
        for (const key in apiDefinition.paths)
        {
            if (Object.prototype.hasOwnProperty.call(apiDefinition.paths, key))
            {
                const pathItem = apiDefinition.paths[key]!;

                this.ConstructRoutingOperation(key, "DELETE", pathItem.delete);
                this.ConstructRoutingOperation(key, "GET", pathItem.get);
                this.ConstructRoutingOperation(key, "POST", pathItem.post);
                this.ConstructRoutingOperation(key, "PUT", pathItem.put);
            }
        }
    }

    private ConstructRoutingOperation(path: string, operationMethod: string, operation: Operation | undefined)
    {
        if(operation === undefined)
            return;

        this.rootRouterNode.Map(path, operationMethod, operation.operationId);
        this.operationMap[operation.operationId] = operation;
    }

    private ExtractArgs(validatedArgs: ValidatedArgs, opStruct: OperationStructure)
    {
        return opStruct.parameters.map(ps => {
            switch(ps.source)
            {
                case "body":
                    return validatedArgs.body;
                case "body-prop":
                    return validatedArgs.body[ps.name];
                case "path":
                    return validatedArgs.routeParams[ps.name];
                case "query":
                    return validatedArgs.queryParams[ps.name];
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