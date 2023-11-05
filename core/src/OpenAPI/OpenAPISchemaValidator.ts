/**
 * ACTS-Util
 * Copyright (C) 2022-2023 Amir Czwink (amir130@hotmail.de)
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

import { NumberSchema, ObjectSchema, OneOfSchema, Reference, Root, Schema, StringSchema } from "./Specification";

export class OpenAPISchemaValidator
{
    constructor(private root: Root)
    {
    }

    //Public methods
    public Validate(value: any, schema: Schema | Reference): boolean
    {
        if("$ref" in schema)
        {
            const refName = schema.$ref.split('/').pop()!;
            const refSchema = this.root.components.schemas[refName]!;
            return this.Validate(value, refSchema);
        }

        if("anyOf" in schema)
            throw new Error("anyOf not implemented");
        if("oneOf" in schema)
            return this.ValidateOneOf(value, schema);

        switch(schema.type)
        {
            case "array":
                if(!Array.isArray(value))
                    return false;
                return value.Values().Map(x => this.Validate(x, schema.items)).All();

            case "boolean":
                return (typeof value === "boolean");

            case "'null'":
                return value === null;

            case "number":
                if(typeof value !== "number")
                    return false;
                return this.ValidateNumber(value, schema);

            case "object":
                if(typeof value !== "object")
                    return false;
                return this.ValidateObject(value, schema);

            case "string":
                if(typeof value !== "string")
                    return false;
                return this.ValidateString(value, schema);
        }
    }

    public ValidateNumber(value: number, schema: NumberSchema)
    {
        let isValid = (schema.minimum === undefined ? true : (value >= schema.minimum))
            && (schema.maximum === undefined ? true : (value <= schema.maximum));
            
        if(schema.enum !== undefined)
        {
            if(!schema.enum.Contains(value))
                isValid = false;
        }
        return isValid;
    }

    public ValidateObject(obj: any, schema: ObjectSchema)
    {
        return schema.properties.Entries().Map(kv => this.ValidateProperty(obj, schema.required, kv.key.toString(), kv.value!)).All();
    }

    public ValidateString(value: string, schema: StringSchema)
    {
        if(schema.enum !== undefined)
        {
            if(!schema.enum.Contains(value))
                return false;
        }
        if(schema.pattern !== undefined)
        {
            const r = new RegExp(schema.pattern);
            const result = r.exec(value);
            if(result === null)
                return false;
        }
        return true;
    }

    //Private methods
    private ValidateProperty(obj: any, requiredProperties: string[], key: string, propertySchema: Schema | Reference): boolean
    {
        const value = obj[key];

        if((value === undefined) && !requiredProperties.includes(key))
            return true;
        return this.Validate(value, propertySchema);
    }

    private ValidateOneOf(value: any, schema: OneOfSchema): boolean
    {
        return schema.oneOf.Values().Map(x => this.Validate(value, x)).Any();
    }
}