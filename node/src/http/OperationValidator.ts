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
import { Dictionary, ObjectExtensions, OpenAPI, OpenAPISchemaValidator } from "acts-util-core";
import { DateTime } from "../DateTime";

export interface ValidatedArgs
{
    body: any;
    queryParams: Dictionary<number | string>;
    routeParams: Dictionary<number | string>;
}

export class OperationValidator
{
    constructor(private apiDefinition: OpenAPI.Root, private operation: OpenAPI.Operation)
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

    private TrySupertypeMatching(a: any, b: any)
    {
        if((typeof a) === (typeof b))
        {
            switch(typeof a)
            {
                case "object":
                {
                    const ka = Object.keys(a);
                    const kb = Object.keys(b);
                    const commonKeys = ka.Values().ToSet().Intersect(kb.Values().ToSet()).ToArray();
                    for (const key of commonKeys)
                    {
                        const x = a[key];
                        const y = b[key];

                        if( (typeof x) !== (typeof y) )
                            throw new Error("TODO: implement me");
                    }
                    if(ka.length > kb.length)
                        return a;
                    else if(ka.length === kb.length)
                        throw new Error("TODO: implement me");
                    return b;
                }
                default:
                    throw new Error("TODO: implement me");
            }
        }
        throw new Error("TODO: implement me");
    }

    private ValidateBody(body: any, requestBody: OpenAPI.RequestBody | undefined)
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

                this._body = this.ValidateValue(body, requestBody.required === true, schema, "body");
            }
        }
    }

    private ValidateQueryParams(queryParams: Dictionary<string>, parameters: OpenAPI.Parameter[])
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
                    dest = this.ValidateValue(decodeURIComponent(src), param.required === true, param.schema, "query");

                this._queryParams[param.name] = dest;
                delete queryParams[param.name];
            }
        }

        if(ObjectExtensions.OwnKeys(queryParams).Any())
            throw new Error("additional query params exist");
    }

    private ValidateRouteParams(routeParams: Dictionary<string>, parameters: OpenAPI.Parameter[])
    {
        for (const param of parameters)
        {
            if(param.in === "path")
            {
                const value = routeParams[param.name];
                const unescaped = (value === undefined ? undefined : decodeURIComponent(value));
                this._routeParams[param.name] = this.ValidateValue(unescaped, true, param.schema, "path");
            }
        }
    }

    private ValidateValue(value: any, required: boolean, schema: OpenAPI.Schema | OpenAPI.Reference, source: "body" | "path" | "query"): any
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
            return this.ValidateValue(value, required, refSchema, source);
        }

        if("anyOf" in schema)
        {
            const matches = [];
            for (const x of schema.anyOf)
            {
                try
                {
                    const matched = this.ValidateValue(value, required, x, source);
                    matches.push(matched);
                }
                catch(e)
                {
                    //not nice code :S
                }
            }
            if(matches.length === 1)
                return matches[0];
            return matches.reduce(this.TrySupertypeMatching.bind(this));
        }
        if("oneOf" in schema)
            return value;

        const validator = new OpenAPISchemaValidator(this.apiDefinition);

        switch(schema.type)
        {
            case "array":
                return value.map( (x: any) => this.ValidateValue(x, true, schema.items, source) );

            case "boolean":
                if(typeof value === "boolean")
                    return value;
                if(source === "query")
                {
                    //in query params, they come as string
                    if(value === "true")
                        return true;
                    if(value === "false")
                        return false;
                }
                throw new Error("NOT IMPLEMENTED: " + (typeof value) + " - " + value);

            case "number":
                let numValue;
                if(typeof value === "number")
                    numValue = value;
                else if(!this.IsNumeric(value))
                    throw new Error("The value '" + value + "' is not numeric");
                else
                    numValue = parseFloat(value);

                if(!validator.ValidateNumber(numValue, schema))
                    throw new Error("illegal enum value: " + value);

                return numValue;

            case "object":
                const result: any = {};

                const req = schema.required.Values().ToSet();
                for (const key in schema.properties)
                {
                    if (Object.prototype.hasOwnProperty.call(schema.properties, key))
                    {
                        result[key] = this.ValidateValue(value[key], req.has(key), schema.properties[key]!, source);
                    }
                }

                return result;

            case "string":
                if(!validator.ValidateString(value, schema))
                    throw new Error("illegal enum value: " + value);
                if(schema.format === "date-time")
                    return DateTime.ConstructFromISOString(value);
                return value;

            case "'null'":
                if(source === "body")
                {
                    if(value === null)
                        return null;
                }
                else if(source === "query")
                {
                    if(value === "null")
                        return null;
                }
                throw new Error("NOT IMPLEMENTED: " + (typeof value) + " - " + value);
        }
    }
}