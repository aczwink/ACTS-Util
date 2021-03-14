/**
 * ACTS-Util
 * Copyright (C) 2020-2021 Amir Czwink (amir130@hotmail.de)
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
import * as fs from "fs";
import * as path from "path";
import { APIEndpointMetadata } from "./API";
import { GlobalInjector } from "./GlobalInjector";

export interface ConfiguredAPIEndPoint<ArgType, ResultType, PropertiesType>
{
    method: (arg: ArgType) => Promise<ResultType>;
    properties: PropertiesType;
}

interface APIClassInstance<T>
{
    __apiEndPointSetups: APIEndpointMetadata<T>[];
    [key: string]: any;
}

export class APILoader<ArgType, ResultType, PropertiesType>
{
    constructor()
    {
        this.apiClasses = [];
    }

    //Public methods
    public GetEndPointSetups(): ConfiguredAPIEndPoint<ArgType, ResultType, PropertiesType>[]
    {
        return this.apiClasses.Values()
            .Map(apiClass => GlobalInjector.Resolve<any>(apiClass))
            .Filter<APIClassInstance<PropertiesType>>(instance => instance.__apiEndPointSetups !== undefined)
            .Map(instance => instance.__apiEndPointSetups.Values()
                .Map( apiEndPointSetup => ({
                    method: instance[apiEndPointSetup.methodName].bind(instance),
                    properties: apiEndPointSetup.properties
                }))
            )
            .Flatten()
            .ToArray();
    }

    public async LoadDirectory(dirPath: string)
    {
        const children = await fs.promises.readdir(dirPath, "utf-8");
        for (const child of children)
        {
            const childPath = path.join(dirPath, child);
            const stats = await fs.promises.stat(childPath);
            
            if(stats.isDirectory())
                await this.LoadDirectory(childPath);
            else if(child.endsWith(".js"))
                await this.LoadFile(childPath); 
        }
    }

    public async LoadFile(filePath: string)
    {
        const apiClass: any = (await import(filePath)).default;
        this.apiClasses.push( apiClass );
    }

    //Private members
    private apiClasses: any[];
}

export function RegisterAPIEndPoint<T>(targetClass: any, methodName: string, properties: T)
{
    if(!("__apiEndPointSetups" in targetClass))
        targetClass.__apiEndPointSetups = [];

    const metadata: APIEndpointMetadata<T> =
    {
        methodName,
        properties
    };
    targetClass.__apiEndPointSetups.push(metadata);
}