/**
 * ACTS-Util
 * Copyright (C) 2019-2023 Amir Czwink (amir130@hotmail.de)
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

import { Dictionary } from "./Dictionary";
import { URLParser } from "./URLParser";

interface URLProperties
{
    readonly protocol: "http" | "https";
    readonly host: string;
    readonly port: number;
    readonly path: string;
    readonly queryParams: Dictionary<string>;
}

/**
 * Represents a fully qualified url.
 */
export class AbsURL implements URLProperties
{
    constructor(properties: URLProperties)
    {
        this.urlProperties = properties;
        this._pathSegments = this.SplitPathIntoSegments(this.urlProperties.path);
    }

    //Properties
    public get authority()
    {
        return this.urlProperties.host + ":" + this.urlProperties.port;
    }

    public get host()
    {
        return this.urlProperties.host;
    }

    public get path()
    {
        return this.urlProperties.path;
    }

    public get pathSegments()
    {
        return this._pathSegments;
    }

    public get port()
    {
        return this.urlProperties.port;
    }

    public get protocol()
    {
        return this.urlProperties.protocol;
    }

    public get queryParams()
    {
        return this.urlProperties.queryParams;
    }

    //Public methods
    public Equals(other: AbsURL)
    {
        return this.ToString() === other.ToString();
    }

    public PathAndQueryToString()
    {
        const queryParams = [];
        for (const key in this.queryParams)
        {
            if (this.queryParams.hasOwnProperty(key))
            {
                const value = this.queryParams[key];
                if(value !== undefined)
                    queryParams.push(key + "=" + encodeURIComponent(value));
            }
        }
        const query = queryParams.length > 0 ? "?" + queryParams.join("&") : "";

        return this.path + query;
    }

    public ToString()
    {
        return this.protocol + "://" + this.authority + this.PathAndQueryToString();
    }

    //Public functions
    public static FromRelative(absolutePrefix: AbsURL, relativePathWithQuery: string)
    {
        const parts = relativePathWithQuery.split("?");
        const relativePath = parts[0];
        const joinedPath = AbsURL.JoinPaths(absolutePrefix.path, relativePath);

        return new AbsURL({
            host: absolutePrefix.host,
            path: joinedPath,
            port: absolutePrefix.port,
            protocol: absolutePrefix.protocol,
            queryParams: URLParser.ParseQueryParams(parts[1] ?? "")
        });
    }

    //Private variables
    private urlProperties: URLProperties;
    private _pathSegments: string[];

    //Private methods
    private SplitPathIntoSegments(path: string)
    {
        if(path.startsWith("/"))
            path = path.slice(1);

        if(path.endsWith("/"))
            path = path.slice(0, -1);
            
        return path.split("/");
    }

    //Private functions
    private static JoinPaths(first: string, second: string)
    {
        if(first.endsWith("/"))
            first = first.slice(0, -1);
        if(second.startsWith("/"))
            second = second.slice(1);

        return first + "/" + second;
    }
}