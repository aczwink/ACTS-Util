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
import ts from "typescript";
import { Dictionary } from "acts-util-core";
import { ResponseMetadata } from "./Metadata";

interface NumberEnumSchema
{
    underlyingType: "number";
    names: string[];
    values: number[];
}
interface StringEnumSchema
{
    underlyingType: "string";
    values: string[];
}
type EnumSchema = NumberEnumSchema | StringEnumSchema;

interface SchemaPropertyEntry
{
    propertyName: string;
    schemaName: string;
    required: boolean;
}

export class TypeCatalog
{
    constructor(private typeChecker: ts.TypeChecker)
    {
        this._namedTypes = {};
    }

    //Properties
    public get namedTypes()
    {
        return this._namedTypes.OwnKeys();
    }

    //Public methods
    public GetEnumProperties(schemaName: string)
    {
        const type = this._namedTypes[schemaName]!;
        return this.TryResolveEnum(type);
    }

    public GetSchemaProperties(schemaName: string)
    {
        const type = this._namedTypes[schemaName]!;

        return type.getProperties().Values().Map(x => {
            const t = this.typeChecker.getTypeOfSymbolAtLocation(x, x.valueDeclaration!);
            const responses = this.ResolveResponsesFromType(t);
            const isRequired = responses.find(x => x.schemaName === "undefined") === undefined;
            const nonOptResponses = responses.filter(x => x.schemaName !== "undefined");
            if(nonOptResponses.length !== 1)
            {
                console.error(nonOptResponses);
                throw new Error("must have exactly one type");
            }

            const prop: SchemaPropertyEntry = {
                propertyName: x.escapedName.toString(),
                schemaName: nonOptResponses[0].schemaName,
                required: isRequired
            }
            return prop;
        });
    }

    public ResolveSchemaNameFromType(typeNode: ts.TypeNode)
    {
        const type = this.typeChecker.getTypeFromTypeNode(typeNode);
        const responses = this.ResolveResponsesFromType(type);
        return responses[0].schemaName;
    }

    public ResolveResponsesFromMethodReturnType(member: ts.MethodDeclaration)
    {
        const symbol = this.typeChecker.getSymbolAtLocation(member.name)!;
        const type = this.typeChecker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);

        const signatures = type.getCallSignatures();
        if(signatures.length !== 1)
            throw new Error("TODO: implement me");

        return this.ResolveResponsesFromType(signatures[0].getReturnType());
    }

    //Private variables
    private _namedTypes: Dictionary<ts.Type>;

    //Private methods
    private CreateStandardReponse(schemaName: string): ResponseMetadata[]
    {
        return [{
            statusCode: 200,
            schemaName
        }];
    }

    private MergeEqual(responses: ResponseMetadata[]): ResponseMetadata[]
    {
        return responses.filter( (x, i) => i === responses.findIndex(y => x.Equals(y)) );
    }

    private RegisterType(schemaName: string, type: ts.Type)
    {
        this._namedTypes[schemaName] = type;
    }

    private ResolveResponsesFromType(type: ts.Type): ResponseMetadata[]
    {
        //console.log(this.typeChecker.typeToString(type));

        const enumCheck = this.TryResolveEnum(type);
        if(enumCheck !== undefined)
        {
            const schemaName = type.aliasSymbol!.escapedName.toString();
            this.RegisterType(schemaName, type);
            return this.CreateStandardReponse(schemaName);
        }

        if(type.isUnion())
        {
            return this.MergeEqual(type.types.Values()
                .Map(x => this.ResolveResponsesFromType(x).Values())
                .Flatten().ToArray());
        }

        if(type.flags & ts.TypeFlags.Any)
            throw new Error("Any not possible!");

        if((type.flags & ts.TypeFlags.Undefined) || (type.flags & ts.TypeFlags.Void))
        {
            return [{
                statusCode: 204,
                schemaName: "undefined"
            }];
        }
        if( (type.flags & ts.TypeFlags.Boolean) || (type.flags & ts.TypeFlags.BooleanLiteral) )
            return this.CreateStandardReponse("boolean");
        if((type.flags & ts.TypeFlags.Number) || type.isNumberLiteral())
        {
            const schemaName = "number";
            return this.CreateStandardReponse(schemaName);
        }
        if(type.isStringLiteral())
        {
            const schemaName = "<" + type.value + ">";
            return this.CreateStandardReponse(schemaName);
        }
        if(type.flags & ts.TypeFlags.String)
        {
            const schemaName = "string";
            return this.CreateStandardReponse(schemaName);
        }

        if(type.symbol.escapedName === "Array")
        {
            const nested = this.typeChecker.getTypeArguments(type as ts.TypeReference);
            const nestedTypes = this.ResolveResponsesFromType(nested[0]);
            return [{
                statusCode: nestedTypes[0].statusCode,
                schemaName: nestedTypes[0].schemaName + "[]"
            }];
        }
        if(type.symbol.escapedName === "Buffer")
        {
            const schemaName = "Buffer";
            return this.CreateStandardReponse(schemaName);
        }
        if(type.symbol.escapedName === "Promise")
        {
            const nested = this.typeChecker.getTypeArguments(type as ts.TypeReference);
            return this.ResolveResponsesFromType(nested[0]);
        }
        if(type.symbol.escapedName === "UploadedFile")
        {
            const schemaName = "UploadedFile";
            return this.CreateStandardReponse(schemaName);
        }
        if(type.aliasSymbol?.escapedName === "TypedHTTPResponse")
        {
            return [{
                statusCode: (type.aliasTypeArguments![0] as ts.NumberLiteralType).value,
                schemaName: this.ResolveResponsesFromType(type.aliasTypeArguments![1])[0].schemaName
            }];
        }

        const schemaName = type.symbol.escapedName.toString();

        this.RegisterType(schemaName, type);
        this.GetSchemaProperties(schemaName).ToArray(); //make sure properties are also registered
        return this.CreateStandardReponse(schemaName);
    }

    private TryResolveEnum(type: ts.Type): EnumSchema | undefined
    {
        if(type.isUnion())
        {
            const names = [];
            const numberValues = [];
            const stringValues = [];
            for (const entry of type.types)
            {
                if(entry.isStringLiteral())
                    stringValues.push(entry.value);
                else if(entry.isNumberLiteral())
                {
                    names.push(entry.symbol.escapedName.toString());
                    numberValues.push(entry.value);
                }
            }
            if(numberValues.length === type.types.length)
            {
                return {
                    underlyingType: "number",
                    names,
                    values: numberValues
                };
            }
            else if(stringValues.length === type.types.length)
            {
                return {
                    underlyingType: "string",
                    values: stringValues
                };
            }
        }
        return undefined;
    }
}