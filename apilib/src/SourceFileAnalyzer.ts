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
import "acts-util-core";
import { APIControllerMetadata, OperationMetadata, ParameterMetadata } from "./Metadata";
import { TypeCatalog } from "./TypeCatalog";
import { HTTPMethod } from "./APIRegistry";

export class SourceFileAnalyzer
{
    constructor(private typeCatalog: TypeCatalog)
    {
    }

    //Public methods
    public Analyze(sourceFile: ts.SourceFile, relativeSourceFilePath: string)
    {
        const syntaxList = sourceFile.getChildren()[0];
        const topLevels = syntaxList.getChildren().Values();

        return topLevels
            .Filter(x => x.kind === ts.SyntaxKind.ClassDeclaration)
            .Map(x => this.FindAPIControllerMetadata(x as ts.ClassDeclaration, relativeSourceFilePath))
            .NotUndefined()
            .ToArray();
    }

    //Private methods
    private CheckAndExtractAPIControllerInfo(decorator: ts.Decorator)
    {
        /*if(decorator.expression.kind === ts.SyntaxKind.Identifier)
            {
                const id = decorator.expression as ts.Identifier;
                if(id.escapedText === )
                {
                    console.log(decorator);
                }
            }*/
        if(ts.isCallExpression(decorator.expression)
            && ts.isIdentifier(decorator.expression.expression)
            && (decorator.expression.expression.escapedText === "APIController")
            )
        {
            const arg = decorator.expression.arguments[0];
            if(ts.isStringLiteral(arg))
            {
                const baseRoute = arg.text;
                return baseRoute;
            }
        }
    }

    private CheckAndExtractAPIMethodDecoratorInfo(decorator: ts.Decorator)
    {
        if(ts.isCallExpression(decorator.expression)
            && ts.isIdentifier(decorator.expression.expression)
            && (["Delete", "Get", "Post", "Put"].Contains(decorator.expression.expression.escapedText.toString()))
        )
        {
            const arg = decorator.expression.arguments[0];
            return {
                httpMethod: this.MapHTTPMethodDecorator(decorator.expression.expression.escapedText.toString()),
                route: ((arg !== undefined) && ts.isStringLiteral(arg) ? arg.text : undefined)
            };
        }
    }

    private ExtractParameterDecoratorInfo(decorators: ts.NodeArray<ts.Decorator> | undefined): "body" | "body-prop" | "form-field" | "path" | "query"
    {
        if((decorators !== undefined) && (decorators.length == 1))
        {
            const node = decorators[0].expression;
            if(ts.isIdentifier(node))
            {
                switch(node.escapedText)
                {
                    case "Body":
                        return "body";
                    case "BodyProp":
                        return "body-prop";
                    case "FormField":
                        return "form-field";
                    case "Path":
                        return "path";
                    case "Query":
                        return "query";
                    default:
                        throw new Error("Method not implemented.");
                }
            }
        }
        throw new Error("Method not implemented.");
    }

    private ExtractParameterInfo(param: ts.ParameterDeclaration): ParameterMetadata
    {
        const nameNode = param.name;

        const schemaName = this.typeCatalog.ResolveSchemaNameFromType(param.type!);
        if(ts.isIdentifier(nameNode))
        {
            return {
                name: nameNode.text,
                source: this.ExtractParameterDecoratorInfo(param.decorators),
                schemaName,
                required: param.questionToken === undefined
            };
        }

        throw new Error("Not implemented");
    }

    private ExtractParametersInfo(parameters: ts.NodeArray<ts.ParameterDeclaration>)
    {
        const infos = [];
        for (const param of parameters)
        {
            infos.push(this.ExtractParameterInfo(param));
        }

        return infos;
    }

    private FindAPIControllerMetadata(classDecl: ts.ClassDeclaration, filePath: string): APIControllerMetadata | undefined
    {
        const baseRoute = this.FindAPIControllerDecorator(classDecl);
        if(baseRoute !== undefined)
        {
            const operations: OperationMetadata[] = [];
            for (const member of classDecl.members)
            {
                if(ts.isMethodDeclaration(member)
                    && (member.decorators !== undefined)
                )
                {
                    const apiDecorator = this.FindAPIMethodDecorator(member.decorators);
                    if(apiDecorator)
                    {
                        const parametersInfo = this.ExtractParametersInfo(member.parameters);
                        //console.log("method: ", (member.name as ts.Identifier).text);
                        const responses = this.typeCatalog.ResolveResponsesFromMethodReturnType(member);
                        operations.push({
                            methodName: (member.name as ts.Identifier).text,
                            parameters: parametersInfo,
                            responses,
                            ...apiDecorator
                        });
                    }
                }
            }

            return {
                //className: classDecl.name!.text,

                baseRoute: "/" + baseRoute,
                operations
            };
        }
    }

    private FindAPIControllerDecorator(classDecl: ts.ClassDeclaration)
    {
        if(classDecl.decorators === undefined)
            return;
        for (const decorator of classDecl.decorators)
        {
            const baseRoute = this.CheckAndExtractAPIControllerInfo(decorator);
            if(baseRoute !== undefined)
                return baseRoute;
        }
    }

    private FindAPIMethodDecorator(decorators: ts.NodeArray<ts.Decorator>)
    {
        for (const decorator of decorators)
        {
            const data = this.CheckAndExtractAPIMethodDecoratorInfo(decorator);
            if(data)
                return data;
        }
    }

    private MapHTTPMethodDecorator(s: string): HTTPMethod
    {
        switch(s)
        {
            case "Delete":
                return "DELETE";
            case "Get":
                return "GET";
            case "Post":
                return "POST";
            case "Put":
                return "PUT";
        }
        throw new Error("NOT IMPLEMENTED");
    }
}