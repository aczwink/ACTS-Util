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
import { Operation, Parameter, Reference, RequestBody, Root, Schema } from "../openapi/Specification";

export interface ValidatedArgs
{
    body: any;
    queryParams: Dictionary<number | string>;
    routeParams: Dictionary<number | string>;
}

export class OperationValidator
{
    constructor(private apiDefinition: Root, private operation: Operation)
    {
        this._queryParams = {};
        this._routeParams = {};
    }

    //Public methods
    public Validate(routeParams: Dictionary<string>, queryParams: Dictionary<string>, body: any): Error | ValidatedArgs
    {
        try
        {
            this.ValidateBody(body, this.operation.requestBody);
            this.ValidateQueryParams(queryParams, this.operation.parameters);
            this.ValidateRouteParams(routeParams, this.operation.parameters);
        }
        catch(err)
        {
            return err as Error;
        }

        return {
            body: this._body,
            queryParams: this._queryParams,
            routeParams: this._routeParams
        };
    }

    //Private members
    private _body: any;
    private _queryParams: Dictionary<number | string>;
    private _routeParams: Dictionary<number | string>;

    //Private methods
    private IsNumeric(str: string)
    {
        str = str.trim();
        if(str.length === 0)
            return false;
        return !isNaN(parseFloat(str));
    }

    private ValidateBody(body: any, requestBody: RequestBody | undefined)
    {
        if(requestBody === undefined)
        {
            for (const key in body)
            {
                if (Object.prototype.hasOwnProperty.call(body, key))
                {
                    const value = body[key];
                    throw new Error("Unexpected body entry");
                }
            }
            return;
        }

        for (const key in requestBody.content)
        {
            if (Object.prototype.hasOwnProperty.call(requestBody.content, key))
            {
                const schema = requestBody.content[key]?.schema!;

                this._body = this.ValidateValue(body, requestBody.required === true, schema);
            }
        }
    }

    private ValidateQueryParams(queryParams: Dictionary<string>, parameters: Parameter[])
    {
        for (const param of parameters)
        {
            if(param.in === "query")
            {
                const src = queryParams[param.name];
                let dest;
                if(src === undefined)
                {
                    if(param.required === true)
                        throw new Error("Missing required query parameter:" + param.name);
                    else
                        dest = undefined;
                }
                else
                    dest = this.ValidateValue(decodeURIComponent(src), param.required === true, param.schema);

                this._queryParams[param.name] = dest;
                delete queryParams[param.name];
            }
        }

        if(queryParams.OwnKeys().Any())
            throw new Error("additional query params exist");
    }

    private ValidateRouteParams(routeParams: Dictionary<string>, parameters: Parameter[])
    {
        for (const param of parameters)
        {
            if(param.in === "path")
                this._routeParams[param.name] = this.ValidateValue(routeParams[param.name], true, param.schema);
        }
    }

    private ValidateValue(value: any, required: boolean, schema: Schema | Reference): any
    {
        if(value === undefined)
        {
            if(required === true)
                throw new Error("Missing required parameter");
            return undefined;
        }

        if("$ref" in schema)
        {
            const refName = schema.$ref.split('/').pop()!;
            const refSchema = this.apiDefinition.components.schemas[refName]!;
            return this.ValidateValue(value, required, refSchema);
        }

        switch(schema.type)
        {
            case "array":
                return value.map( (x: any) => this.ValidateValue(x, true, schema.items) );

            case "number":
                if(typeof value === "number")
                    return value;

                if(!this.IsNumeric(value))
                    throw new Error("The value '" + value + "' is not numeric");
                const numValue = parseFloat(value);
                if(schema.enum !== undefined)
                {
                    if(!schema.enum.Contains(numValue))
                        throw new Error("illegal enum value: " + value);
                }
                return numValue;

            case "object":
                const result: any = {};

                const req = schema.required.Values().ToSet();
                for (const key in schema.properties)
                {
                    if (Object.prototype.hasOwnProperty.call(schema.properties, key))
                    {
                        result[key] = this.ValidateValue(value[key], req.has(key), schema.properties[key]!);
                    }
                }

                return result;

            case "string":
                if(schema.enum !== undefined)
                {
                    if(!schema.enum.Contains(value))
                        throw new Error("illegal enum value: " + value);
                }
                return value;
        }
    }
}