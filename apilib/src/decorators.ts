/**
 * ACTS-Util
 * Copyright (C) 2020-2026 Amir Czwink (amir130@hotmail.de)
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
import { Dictionary } from "@aczwink/acts-util-core";
import { GlobalInjector } from "@aczwink/acts-util-node";
import { APIRegistryInstance, HTTPMethod } from "./APIRegistry";

interface APIClassInstance<PropertiesType, ParameterType>
{
    __apiEndPointSetups: PropertiesType[];
    __apiCommonMethodName?: string;
    __apiParameters: Dictionary<ParameterType[]>;
    [key: string]: any;
}

interface HTTPEndPointProperties
{
    httpMethod: HTTPMethod;
    route: string;
    methodName: string;
}

function MakeObjectAPIClassInstance<T = any>(target: any)
{
    const typed = target as APIClassInstance<T, any>;
    if(!("__apiEndPointSetups" in target))
    {
        typed.__apiEndPointSetups = [];
        typed.__apiParameters = {};
    }
    return typed;
}

function HTTPMethodDecoratorReturn(route: string | undefined, httpMethod: HTTPMethod)
{
    return function(targetClass: any, methodName: string, methodDescriptor: PropertyDescriptor)
    {
        const properties: HTTPEndPointProperties = {
            httpMethod,
            route: (route === undefined ? "" : "/" + route),
            methodName
        };
        RegisterAPIEndPoint(targetClass, properties);
    };
}

function RegisterAPIEndPoint<T>(target: any, properties: T)
{
    const instance = MakeObjectAPIClassInstance(target);
    instance.__apiEndPointSetups.push(properties);
}



export function APIController<T extends {new(...args:any[]):{}}>(baseRoute: string)
{
    return function (constructor:T)
    {
        const apiClassInstance = MakeObjectAPIClassInstance<HTTPEndPointProperties>(constructor.prototype);
        const setups = apiClassInstance.__apiEndPointSetups;

        GlobalInjector.RegisterProvider(constructor, constructor);
        const instance: any = GlobalInjector.Resolve(constructor);

        setups.Values().ForEach(props => {
            let func = instance[props.methodName].bind(instance);

            if(apiClassInstance.__apiCommonMethodName !== undefined)
            {
                const commonFunc = instance[apiClassInstance.__apiCommonMethodName].bind(instance);
                const commonArgsLength = commonFunc.length;
                const origFunc = func;

                func = async function(...args: any[])
                {
                    const result = await commonFunc(...args.slice(0, commonArgsLength));
                    if( (result !== undefined) && (result !== null) && (typeof result.statusCode === "number") )
                        return result;
                    if(result === undefined)
                        return await origFunc(...args.slice(commonArgsLength));
                    return await origFunc(result, ...args.slice(commonArgsLength));
                };
            }

            APIRegistryInstance.RegisterEndPoint("/" + baseRoute + props.route, props.httpMethod, func)
        });
    };
}

export function Auth(format: "jwt")
{
    return function(targetObject: Object, methodName: string, parameterIndex: number)
    {
    }
}

export function Body(targetObject: Object, methodName: string, parameterIndex: number)
{
}

export function BodyProp(targetObject: Object, methodName: string, parameterIndex: number)
{
}

export function Common(): (targetClass: any, methodName: string, methodDescriptor: PropertyDescriptor) => void;
export function Common(targetObject: Object, methodName: string, parameterIndex: number): void;
export function Common(targetClassOrObject?: Object, methodName?: string, methodDescriptorOrarameterIndex?: PropertyDescriptor | number)
{
    return function(targetClass: any, methodName: string)
    {
        if(targetClassOrObject === undefined)
        {
            const instance = MakeObjectAPIClassInstance(targetClass);
            instance.__apiCommonMethodName = methodName;
        }
    };
}

export function Delete(route?: string)
{
    return HTTPMethodDecoratorReturn(route, "DELETE");
}

export function FormField(targetObject: Object, methodName: string, parameterIndex: number)
{
}

export function Get(route?: string)
{
    return HTTPMethodDecoratorReturn(route, "GET");
}

export function Header(targetObject: Object, methodName: string, parameterIndex: number)
{
}

export function Patch(route?: string)
{
    return HTTPMethodDecoratorReturn(route, "PATCH");
}

export function Path(targetObject: Object, methodName: string, parameterIndex: number)
{
}

export function Post(route?: string)
{
    return HTTPMethodDecoratorReturn(route, "POST");
}

export function Put(route?: string)
{
    return HTTPMethodDecoratorReturn(route, "PUT");
}

export function Query(targetObject: Object, methodName: string, parameterIndex: number)
{
}

export function Request(targetObject: Object, methodName: string, parameterIndex: number)
{
}

export function Security(securitySchemeName?: string, oAuthScopes?: string[])
{
    return function(targetClass: any, methodName?: string, methodDescriptor?: PropertyDescriptor)
    {
    }
}