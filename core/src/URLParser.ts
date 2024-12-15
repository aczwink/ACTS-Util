/**
 * ACTS-Util
 * Copyright (C) 2019-2024 Amir Czwink (amir130@hotmail.de)
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

export interface URLProperties
{
    readonly protocol: "http" | "https";
    readonly host: string;
    readonly port: number;
    readonly path: string;
    readonly queryParams: Dictionary<string>;
    readonly fragment?: string;
}

export class URLParser
{
    public static Parse(url: string): URLProperties
    {
        let protocol: "http" | "https";
        if(url.startsWith("http://"))
        {
            protocol = "http";
            url = url.substring("http://".length);
        }
        else if(url.startsWith("https://"))
        {
            protocol = "https";
            url = url.substring("https://".length);
        }
        else
            throw new Error("Unknown protocol: " + url);

        const slashPos = url.indexOf("/");
        const pathPos = (slashPos === -1) ? url.length : slashPos;

        const hostPort = url.substring(0, pathPos);
        const hostParts = hostPort.split(":");

        let port = 80;
        if(hostParts.length === 2)
        {
            port = parseInt(hostParts[1]);
        }
        else if(protocol === "https")
            port = 443;

        const pathAndQuery = url.substring(pathPos);
        const parts = pathAndQuery.split("?");

        return {
            host: hostParts[0],
            path: parts[0],
            port,
            protocol,
            queryParams: (parts.length === 2) ? this.ParseQueryParams(parts[1]) : {},
        };
    }

    public static ParseQueryParams(queryParamsString: string): Dictionary<string>
    {
        const queryParamsParts = queryParamsString.length > 0 ? queryParamsString.split("&") : [];
        const queryParams: Dictionary<string> = {};
        queryParamsParts.forEach(kv => {
            const split = kv.split("=")
            queryParams[split[0]] = split[1];
        });
        return queryParams;
    }
}