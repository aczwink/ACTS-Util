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

import { Reference, Root, Schema } from "./Specification";

export class OpenAPIDefaultObjectCreator
{
    constructor(private root: Root)
    {
    }

    //Public methods
    public Create(schema: Schema | Reference): any
    {
        if("anyOf" in schema)
            return this.Create(schema.anyOf[0]);
        if("oneOf" in schema)
            return this.Create(schema.oneOf[0]);
        if("$ref" in schema)
        {
            const schemaName = schema.$ref.split("/").pop()!;
            return this.Create(this.root.components.schemas[schemaName]!);
        }

        switch(schema.type)
        {
            case "array":
                return [];
            case "boolean":
                if(schema.default !== undefined)
                    return schema.default;
                return false;
            case "number":
                if(schema.default !== undefined)
                    return schema.default;
                if(schema.enum !== undefined)
                    return schema.enum[0];
                return 0;
            case "object":
                return schema.required.Values().ToDictionary(x => x, x => this.Create(schema.properties[x]!))
            case "string":
                if(schema.default !== undefined)
                    return schema.default;
                if(schema.enum !== undefined)
                    return schema.enum[0];
                return "";
        }
    }
}