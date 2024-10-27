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
import ts from "typescript";
import { Dictionary, EqualsAny, ObjectExtensions } from "acts-util-core";
import { ResponseMetadata } from "./Metadata";

interface HTTPResponseWithCode
{
    kind: "HTTPResponseWithCode";
    statusCode: number;
    type: TypeOrRef;
}

interface NumberEnumSchema
{
    underlyingType: "number";
    names?: string[];
    values: number[];
}
interface StringEnumSchema
{
    underlyingType: "string";
    values: string[];
}
export type EnumSchema = NumberEnumSchema | StringEnumSchema;

export interface DocumentationData
{
    default?: any;
    description?: string;
    format?: string;
    minimum?: number;
    maximum?: number;
    pattern?: string;
    title?: string;
}

export interface SchemaPropertyEntry
{
    docData: DocumentationData;
    propertyName: string;
    type: TypeOrRef;
    required: boolean;
}


interface BaseType
{
    type: ts.Type;
}

interface ArrayType extends BaseType
{
    kind: "array";
    entryType: TypeOrRef;
}

interface EnumType extends BaseType
{
    kind: "enum";
    schema: EnumSchema;
}

interface ObjectType extends BaseType
{
    kind: "object";
    docData: DocumentationData;
    properties: SchemaPropertyEntry[];
}

interface UnionType extends BaseType
{
    kind: "union";
    subTypes: TypeOrRef[];
}

export type Type = ArrayType | EnumType | ObjectType | UnionType;
export type TypeOrRef = Type | string;

export class TypeCatalog
{
    constructor(private typeChecker: ts.TypeChecker)
    {
        this._namedTypes = {};
    }

    //Properties
    public get namedTypes()
    {
        return ObjectExtensions.OwnKeys(this._namedTypes).Map(k => k.toString());
    }

    //Public methods
    public GetNamedType(schemaName: string)
    {
        const obj = ObjectExtensions.Clone(this._namedTypes[schemaName]!);
        delete (obj as any).type;

        return obj;
    }

    public ResolveConstant(identifier: ts.Identifier)
    {
        const type = this.typeChecker.getTypeAtLocation(identifier);
        if(type.isStringLiteral())
            return type.value;
        throw new Error("Method not implemented.");
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
    private _namedTypes: Dictionary<Type>;

    //Private methods
    private BuildDocumentationData(symbol: ts.Symbol): DocumentationData
    {
        const displayParts = symbol.getDocumentationComment(this.typeChecker);
        const doc = ts.displayPartsToString(displayParts).trim();

        const jsDocs = symbol.getJsDocTags(this.typeChecker);
        const defaultNode = jsDocs.find(x => x.name === "default");
        const formatNode = jsDocs.find(x => x.name === "format");
        const minimumNode = jsDocs.find(x => x.name === "minimum");
        const maximumNode = jsDocs.find(x => x.name === "maximum");
        const patternNode = jsDocs.find(x => x.name === "pattern");
        const titleNode = jsDocs.find(x => x.name === "title");

        return {
            default: defaultNode === undefined ? undefined : this.BuildDocumentationDefaultValue(ts.displayPartsToString(defaultNode.text), symbol),
            description: doc.length === 0 ? undefined : doc,
            format: formatNode === undefined ? undefined : ts.displayPartsToString(formatNode.text),
            minimum: minimumNode === undefined ? undefined : this.BuildDocumentationNumberValue(ts.displayPartsToString(minimumNode.text)),
            maximum: maximumNode === undefined ? undefined : this.BuildDocumentationNumberValue(ts.displayPartsToString(maximumNode.text)),
            pattern: patternNode === undefined ? undefined : ts.displayPartsToString(patternNode.text),
            title: titleNode === undefined ? undefined : ts.displayPartsToString(titleNode.text)
        };
    }

    private BuildDocumentationDefaultValue(stringValue: string, symbol: ts.Symbol)
    {
        const type = this.typeChecker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);

        if( (type.flags & ts.TypeFlags.Boolean) || (type.flags & ts.TypeFlags.BooleanLiteral) )
            return stringValue === "true";
        if((type.flags & ts.TypeFlags.Number) || type.isNumberLiteral())
            return this.BuildDocumentationNumberValue(stringValue)
        return stringValue;
    }

    private BuildDocumentationNumberValue(stringValue: string)
    {
        if(stringValue.startsWith("0o"))
            return parseInt(stringValue.substring(2), 8);
        return parseFloat(stringValue);
    }

    private CreateStandardReponse(schemaName: TypeOrRef): ResponseMetadata[]
    {
        return [{
            statusCode: 200,
            schemaName
        }];
    }

    private MergeEqualTypes(types: (string | Type)[])
    {
        return types.filter( (x, i) => i === types.findIndex(y => EqualsAny(x, y)) );
    }

    private RegisterType(schemaName: string, namedType: Type)
    {
        if( (this._namedTypes[schemaName] !== undefined) && (this._namedTypes[schemaName]!.type !== namedType.type) )
            throw new Error("name conflict for schema: " + schemaName);
        this._namedTypes[schemaName] = namedType;

        return schemaName;
    }

    private RegisterTypeIfAliased(namedType: Type)
    {
        const aliasName = namedType.type.aliasSymbol?.escapedName.toString();
        if(aliasName === undefined)
            return namedType;
            
        return this.RegisterType(aliasName, namedType);
    }

    private ResolveObjectProperties(type: ts.Type)
    {
        return type.getProperties().Values().Map(symbol => {
            const t = this.typeChecker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);
            const propType = this.ResolveType(t) as any;

            const result = this.ResolvePropertyType(propType);

            const prop: SchemaPropertyEntry = {
                docData: this.BuildDocumentationData(symbol),
                propertyName: symbol.escapedName.toString(),
                type: result.propType,
                required: result.required
            }
            return prop;
        }).ToArray();
    }

    private ResolvePropertyType(propType: TypeOrRef)
    {
        if(typeof propType === "string")
            return { required: true, propType };

        if(propType.kind === "union")
        {
            const isRequired = propType.subTypes.find(x => x === "undefined") === undefined;
            const nonOptResponses = propType.subTypes.filter(x => x !== "undefined");

            const rest: UnionType = { kind: "union", type: propType.type, subTypes: nonOptResponses };
            const result = nonOptResponses.length === 1 ? nonOptResponses[0] : rest;

            return { required: isRequired, propType: result };
        }

        return { required: true, propType };
    }

    private CreateResponsesFromType(mappedType: TypeOrRef | HTTPResponseWithCode): ResponseMetadata[]
    {
        if(typeof mappedType === "string")
        {
            if(mappedType === "undefined")
            {
                return [{
                    statusCode: 204,
                    schemaName: mappedType
                }];
            }
            return this.CreateStandardReponse(mappedType);
        }
        else if(mappedType.kind === "HTTPResponseWithCode")
        {
            return [{
                statusCode: mappedType.statusCode,
                schemaName: mappedType.type
            }];
        }
        else if(mappedType.kind === "union")
            return mappedType.subTypes.Values().Map(this.CreateResponsesFromType.bind(this)).Map(x => x.Values()).Flatten().ToArray();
        
        return this.CreateStandardReponse(mappedType);
    }

    private ResolveResponsesFromType(type: ts.Type)
    {
        const mappedType = this.ResolveType(type);
        return this.CreateResponsesFromType(mappedType);

        /*
        if(type.flags & ts.TypeFlags.Any)
            throw new Error("Any not possible!");
        if(type.symbol.escapedName === "Readable")
        {
            const schemaName = "Buffer";
            return this.CreateStandardReponse(schemaName);
        }
        if(type.symbol.escapedName === "Request")
        {
            const schemaName = "Request";
            return this.CreateStandardReponse(schemaName);
        }
        */
    }
    
    private ResolveType(type: ts.Type): TypeOrRef | HTTPResponseWithCode
    {
        const aliasName = type.aliasSymbol?.escapedName.toString();
        //console.log(this.typeChecker.typeToString(type), aliasName);
        if( (aliasName !== undefined) && (this._namedTypes[aliasName]?.type === type) )
            return aliasName;

        const enumCheck = this.TryResolveEnum(type);
        if(enumCheck !== undefined)
            return this.RegisterTypeIfAliased({ kind: "enum", type, schema: enumCheck });

        if(type.isUnion())
        {
            const subTypes: TypeOrRef[] = [];
            const unionType: UnionType = { kind: "union", type, subTypes };
            const result = this.RegisterTypeIfAliased(unionType); //register it now to avoid cycles

            const resolvedSubTypes = this.MergeEqualTypes(
                type.types.Values().Map(x => this.ResolveType(x)).ToArray() as any
            );
            subTypes.push(...resolvedSubTypes);

            if(subTypes.length === 1)
            {
                if(aliasName !== undefined)
                    delete this._namedTypes[aliasName];

                const newRes = subTypes[0];
                if(typeof newRes === "string")
                    return newRes;
                return this.RegisterTypeIfAliased(newRes);
            }

            return result;
        }

        if((type.flags & ts.TypeFlags.Undefined) || (type.flags & ts.TypeFlags.Void))
            return "undefined";

        if(type.flags & ts.TypeFlags.Null)
            return "null";

        if( (type.flags & ts.TypeFlags.Boolean) || (type.flags & ts.TypeFlags.BooleanLiteral) )
            return "boolean";

        if((type.flags & ts.TypeFlags.Number) || type.isNumberLiteral())
            return "number";
        if(type.isStringLiteral())
        {
            return {
                kind: "enum",
                type,
                schema: {
                    underlyingType: "string",
                    values: [type.value]
                }
            };
        }
        if(type.flags & ts.TypeFlags.String)
            return "string";

        if(type.flags === ts.TypeFlags.NonPrimitive)
            return "object";

        if(type.symbol === undefined)
        {
            console.log(type);
            throw new Error("TODO: implement me");
        }

        if(type.symbol.escapedName === "Array")
        {
            const nested = this.typeChecker.getTypeArguments(type as ts.TypeReference);
            const nestedType = this.ResolveType(nested[0]) as any;
            return {
                kind: "array",
                entryType: nestedType,
                type
            };
        }
        if(type.symbol.escapedName === "Promise")
        {
            const nested = this.typeChecker.getTypeArguments(type as ts.TypeReference);
            return this.ResolveType(nested[0]);
        }

        if(type.aliasSymbol?.escapedName === "TypedHTTPResponse")
        {
            return {
                kind: "HTTPResponseWithCode",
                statusCode: (type.aliasTypeArguments![0] as ts.NumberLiteralType).value,
                type: this.ResolveType(type.aliasTypeArguments![1]) as any
            };
        }
        
        const passthrough = ["Buffer", "Date", "DateTime", "Readable", "UploadedFile"];
        for (const entry of passthrough)
        {
            if(type.symbol.escapedName === entry)
                return entry;
        }

        const t: ObjectType = { kind: "object", type, docData: this.BuildDocumentationData(type.symbol), properties: this.ResolveObjectProperties(type) };
        if(aliasName !== undefined)
            return this.RegisterTypeIfAliased(t);

        const literalTypes = ["__object", "__type"];
        if(!literalTypes.Contains(type.symbol.name))
            return this.RegisterType(type.symbol.name, t);
        return t;
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
                    if(entry.symbol !== undefined)
                        names.push(entry.symbol.escapedName.toString());
                    numberValues.push(entry.value);
                }
            }
            if(numberValues.length === type.types.length)
            {
                return {
                    underlyingType: "number",
                    names: (names.length === numberValues.length) ? names : undefined,
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