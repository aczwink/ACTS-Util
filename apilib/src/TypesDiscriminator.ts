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

import { ObjectExtensions } from "@aczwink/acts-util-core";
import { EnumSchema, TypeCatalog, TypeOrRef } from "./TypeCatalog";

export class TypesDiscriminator
{
    constructor(private typeCatalog: TypeCatalog)
    {
    }

    //Public methods
    public FindDiscriminatorProperty(types: TypeOrRef[])
    {
        const possibleProps = types.Values().Map(this.ResolveReferences.bind(this)).Map(this.ResolveProperties.bind(this)).ToArray();
        if(possibleProps.Values().Filter(x => x === null).Any())
            return null;
        const candidates = possibleProps.Values().NotNull().Map(ps => ObjectExtensions.OwnKeys(ps).ToSet()).Accumulate( (acc, next) => acc.Intersect(next) ).ToArray();
        for (const candidate of candidates)
        {
            const candidateTypes = possibleProps.Values().NotNull().Map(ps => ps[candidate]!.type).Map(this.ResolveReferences.bind(this)).ToArray();
            if(this.AreTypesDiscriminant(candidateTypes))
                return candidate.toString();
        }
        return null;
    }

    //Private methods
    private AreAllEnumsDisjunctive(enumSchemas: EnumSchema[])
    {
        for(let i = 0; i < enumSchemas.length; i++)
        {
            for(let j = i + 1; j < enumSchemas.length; j++)
            {
                if(!this.AreEnumsDisjunct(enumSchemas[i], enumSchemas[j]))
                    return false;
            }
        }
        return true;
    }

    private AreEnumsDisjunct(a: EnumSchema, b: EnumSchema)
    {
        if((a.underlyingType === "string") && (b.underlyingType === "string"))
        {
            return a.values.Values().ToSet().Intersect(b.values.Values().ToSet()).size === 0;
        }
        else if((a.underlyingType === "number") && (b.underlyingType === "number"))
            throw new Error("Not implemented");
        return true;
    }

    private AreTypesDiscriminant(types: TypeOrRef[])
    {
        //TODO: not implemented for anything else but enum right now
        const enumSchemas = types.Values().Map(x => typeof x === "string" ? null : (x.kind === "enum" ? x.schema : null)).NotNull().ToArray();
        if(enumSchemas.length != types.length)
            return false;

        return this.AreAllEnumsDisjunctive(enumSchemas);
    }

    private ResolveProperties(type: TypeOrRef)
    {
        if(typeof type === "string")
            return null;

        if(type.kind === "object")
            return type.properties.Values().ToDictionary(p => p.propertyName, p => p);
        return null;
    }

    private ResolveReferences(type: TypeOrRef): TypeOrRef
    {
        if(typeof type === "string")
        {
            switch(type)
            {
                case "boolean":
                case "null":
                case "number":
                case "string":
                    return type;
            }
            return this.ResolveReferences(this.typeCatalog.GetNamedType(type));
        }
        return type;
    }
}