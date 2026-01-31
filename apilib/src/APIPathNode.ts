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

import { Dictionary, ObjectExtensions, OpenAPI } from "@aczwink/acts-util-core";

export class APIPathNode
{
    constructor()
    {
        this._children = {};
        this.hasOnlyWildCardChild = false;
        this._wildCardName = "";
    }

    //Properties
    public get children()
    {
        return ObjectExtensions.Entries(this._children);
    }

    public get pathItem()
    {
        return this._pathItem;
    }

    public get wildCardName()
    {
        return this._wildCardName;
    }

    //Public methods
    public Add(pathSegments: string[], pathItem: OpenAPI.PathItem): void
    {
        if(pathSegments.length === 0)
        {
            if(this._pathItem === undefined)
                this._pathItem = pathItem;
            else
                throw new Error("not implemented1");
            return;
        }
    
        const currentSegment = pathSegments[0];
        if(currentSegment.startsWith("{") && currentSegment.endsWith("}"))
        {
            if(this.hasOnlyWildCardChild)
                return this._children["*"]!.Add(pathSegments.slice(1), pathItem);

            if(ObjectExtensions.Values(this._children).Any())
                throw new Error("Conflict: Route with segment '" + currentSegment + "' is supposed to be wildcard but already has children: " + this.children.Map(x => x.key.toString()).Join(", "));
            this.hasOnlyWildCardChild = true;
            const child = this._children["*"] = new APIPathNode;
            child._wildCardName = currentSegment;
            return child.Add(pathSegments.slice(1), pathItem);
        }

        if(this.hasOnlyWildCardChild)
            throw new Error("Conflict: Can't add route because a wildcard was already specified: " + pathSegments.join("/"));

        if(this._children[currentSegment] === undefined)
            this._children[currentSegment] = new APIPathNode;
        const child = this._children[currentSegment];
        child?.Add(pathSegments.slice(1), pathItem);
    }

    //Private variables
    private _children: Dictionary<APIPathNode>;
    private _pathItem: OpenAPI.PathItem | undefined;
    private hasOnlyWildCardChild: boolean;
    private _wildCardName: string;
}