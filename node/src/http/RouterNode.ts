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

import { Dictionary } from "acts-util-core";

export class RouterNode
{
    constructor()
    {
        this.children = {};
        this.operationMethodMap = {};
    }

    //Public methods
    public Map(path: string, operationMethod: string, operationId: string)
    {
        this.MapSegments(path.split("/").slice(1), operationMethod, operationId);
    }

    public Match(pathSegments: string[], httpMethod: string, routeParams: Dictionary<string>): string | null
    {
        if(pathSegments.length === 0)
        {
            const operationId = this.operationMethodMap[httpMethod];
            if(operationId === undefined)
                return null;
            return operationId;
        }

        const childSegment = pathSegments[0];
        const remaining = pathSegments.slice(1);

        if(this.wildcardParamName !== undefined)
        {
            routeParams[this.wildcardParamName] = childSegment;
            const child = this.children["*"]!;
            return child.Match(remaining, httpMethod, routeParams);
        }

        const child = this.children[childSegment];
        if(child === undefined)
            return null;
        return child.Match(remaining, httpMethod, routeParams);
    }

    //Private variables
    private children: Dictionary<RouterNode>;
    private operationMethodMap: Dictionary<string>;
    private wildcardParamName?: string;

    //Private methods
    private FindChild(childSegment: string)
    {
        const wildcardName = this.TryExtractWildcardName(childSegment);
        if(wildcardName !== undefined)
        {
            this.wildcardParamName = wildcardName;
            childSegment = "*";
        }

        if(!(childSegment in this.children))
            this.children[childSegment] = new RouterNode;
            
        return this.children[childSegment]!;
    }

    private MapSegments(pathSegments: string[], operationMethod: string, operationId: string)
    {
        if(pathSegments.length == 0)
        {
            this.operationMethodMap[operationMethod] = operationId;
            return;
        }

        const childSegment = pathSegments[0];
        const remaining = pathSegments.slice(1);

        const child = this.FindChild(childSegment);
        child.MapSegments(remaining, operationMethod, operationId);
    }

    private TryExtractWildcardName(childSegment: string)
    {
        if(childSegment.startsWith("{") && childSegment.endsWith("}"))
            return childSegment.slice(1, -1);
        return undefined;
    }
}