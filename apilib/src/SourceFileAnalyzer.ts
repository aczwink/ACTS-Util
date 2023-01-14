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
import { APIControllerMetadata, CommonMethodMetadata, OperationMetadata, ParameterMetadata } from "./Metadata";
import { TypeCatalog } from "./TypeCatalog";
import { HTTPMethod } from "./APIRegistry";

interface CommonMethodDecoratorInfo
{
    type: "common-method";
}
interface OperationDecoratorInfo
{
    type: "operation";
    httpMethod: HTTPMethod;
    route?: string;
}
interface SecurityDecoratorInfo
{
    type: "security";
    security: string[];
}

type MethodDecoratorInfo = CommonMethodDecoratorInfo | OperationDecoratorInfo | SecurityDecoratorInfo;

interface CommonAPIMethodInfo
{
    type: "common-method";
}
interface OperationAPIMethodInfo
{
    type: "operation";
    httpMethod: HTTPMethod;
    route: string | undefined;
    security: string[] | undefined;
}

type APIMethodInfo = CommonAPIMethodInfo | OperationAPIMethodInfo;

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
            if(ts.isTemplateExpression(arg))
                return this.EvaluateTemplateExpression(arg);
        }
    }

    private EvaluateTemplateExpression(expr: ts.TemplateExpression)
    {
        const tc = this.typeCatalog;

        function EvalTemplateSpanExpr(spanExpr: ts.Expression)
        {
            if(ts.isIdentifier(spanExpr))
                return tc.ResolveConstant(spanExpr);
            throw new Error("NOT IMPLEMENTED");
        }

        return expr.head.text + expr.templateSpans.map(span => EvalTemplateSpanExpr(span.expression) + span.literal.text).join("");
    }

    private CheckAndExtractAPIMethodDecoratorInfo(decorator: ts.Decorator): MethodDecoratorInfo | undefined
    {
        if( ts.isCallExpression(decorator.expression) && ts.isIdentifier(decorator.expression.expression) )
        {
            if( ["Delete", "Get", "Patch", "Post", "Put"].Contains(decorator.expression.expression.escapedText.toString()) )
            {
                const arg = decorator.expression.arguments[0];
                return {
                    type: "operation",
                    httpMethod: this.MapHTTPMethodDecorator(decorator.expression.expression.escapedText.toString()),
                    route: ((arg !== undefined) && ts.isStringLiteral(arg) ? arg.text : undefined)
                };
            }
            else if(decorator.expression.expression.escapedText === "Common")
            {
                return {
                    type: "common-method"
                };
            }
            else if(decorator.expression.expression.escapedText === "Security")
            {
                const arg = decorator.expression.arguments[0];
                return {
                    type: "security",
                    security: []
                };
            }
        }
    }

    private ExtractParameterDecoratorInfo(decorators: readonly ts.Decorator[] | undefined)
        : "body" | "body-prop" | "common-data" | "form-field" | "header" | "path" | "query" | "request"
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
                    case "Common":
                        return "common-data";
                    case "FormField":
                        return "form-field";
                    case "Header":
                        return "header";
                    case "Path":
                        return "path";
                    case "Query":
                        return "query";
                    case "Request":
                        return "request";
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
                source: this.ExtractParameterDecoratorInfo(ts.getDecorators(param)),
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
            const className = classDecl.name!.text;

            let common: CommonMethodMetadata | undefined;
            const operations: OperationMetadata[] = [];
            for (const member of classDecl.members)
            {
                if(ts.isMethodDeclaration(member) && ts.canHaveDecorators(member) && (ts.getDecorators(member) !== undefined)
                )
                {
                    const apiDecorator = this.FindAPIMethodDecorators(ts.getDecorators(member)!);
                    if(apiDecorator)
                    {
                        const methodName = (member.name as ts.Identifier).text;
                        const parametersInfo = this.ExtractParametersInfo(member.parameters);
                        //console.log("method: ", (member.name as ts.Identifier).text);
                        const responses = this.typeCatalog.ResolveResponsesFromMethodReturnType(member);

                        if(apiDecorator.type === "common-method")
                        {
                            if(common === undefined)
                            {
                                common = {
                                    methodName,
                                    parameters: parametersInfo,
                                    responses
                                };
                            }
                            else
                                throw new Error("Can't have two common methods in same api controller: " + className);
                        }
                        else
                        {
                            operations.push({
                                methodName,
                                parameters: parametersInfo,
                                responses,
                                ...apiDecorator
                            });
                        }
                    }
                }
            }

            return {
                //className,

                baseRoute: "/" + baseRoute,
                common,
                operations
            };
        }
    }

    private FindAPIControllerDecorator(classDecl: ts.ClassDeclaration)
    {
        if(!ts.canHaveDecorators(classDecl))
            return;
        const decorators = ts.getDecorators(classDecl);
        if(decorators === undefined)
            return;

        for (const decorator of decorators)
        {
            const baseRoute = this.CheckAndExtractAPIControllerInfo(decorator);
            if(baseRoute !== undefined)
                return baseRoute;
        }
    }

    private FindAPIMethodDecorators(decorators: readonly ts.Decorator[]): APIMethodInfo | undefined
    {
        let common: CommonMethodDecoratorInfo | undefined;
        let op: OperationDecoratorInfo | undefined;
        let sec: SecurityDecoratorInfo | undefined;
        for (const decorator of decorators)
        {
            const data = this.CheckAndExtractAPIMethodDecoratorInfo(decorator);
            switch(data?.type)
            {
                case "common-method":
                    common = data;
                    break;
                case "operation":
                    op = data;
                    break;
                case "security":
                    sec = data;
                    break;
            }
        }

        if(common === undefined)
        {
            if(op === undefined)
                return undefined;

            return {
                type: "operation",
                httpMethod: op.httpMethod,
                route: op.route,
                security: sec?.security
            };
        }

        return {
            type: "common-method"
        };
    }

    private MapHTTPMethodDecorator(s: string): HTTPMethod
    {
        switch(s)
        {
            case "Delete":
                return "DELETE";
            case "Get":
                return "GET";
            case "Patch":
                return "PATCH";
            case "Post":
                return "POST";
            case "Put":
                return "PUT";
        }
        throw new Error("NOT IMPLEMENTED");
    }
}