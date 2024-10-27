/**
 * ACTS-Util
 * Copyright (C) 2020-2024 Amir Czwink (amir130@hotmail.de)
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
import http from "http";
import https from "https";
import { AbsURL, ObjectExtensions } from "acts-util-core";
import { ResponseHeaders } from "./Response";

export interface RequestHeaders
{
    Authorization?: string;
    "Content-Type"?: "application/json";
    "Content-Length"?: number;
    Host?: string;
    "User-Agent"?: string;
}

export type HTTPMethod = "DELETE" | "GET" | "PATCH" | "PUT" | "POST";

interface Request
{
    body: Buffer;
    headers: RequestHeaders;
    method: HTTPMethod;
    url: AbsURL;
}

interface RawResult
{
    body: Buffer;
    headers: http.IncomingHttpHeaders;
    statusCode: number;
}

interface Response
{
    body: Buffer;
    headers: ResponseHeaders;
    statusCode: number;
}


export class RequestSender
{
    //Public methods
    public async SendRequest(request: Request): Promise<Response>
    {
        const httpRequest: http.RequestOptions = {
            protocol: (request.url.protocol === "https") ? "https:" : "http:",
            hostname: request.url.host,
            port: request.url.port,
            path: request.url.PathAndQueryToString(),
            method: request.method,
            headers: ObjectExtensions.Entries(this.MapRequestHeaders(request.headers))
                .Filter(kv => kv.value !== undefined).ToDictionary(kv => kv.key, kv => kv.value), //bug in http tries to set also "undefined"
        };
        const result = await this.IssueRequest(httpRequest, request.body);

        return {
            statusCode: result.statusCode,
            headers: this.MapResponseHeaders(result.headers),
            body: result.body
        };
    }

    //Private methods
    private IssueRequest(request: http.RequestOptions, body: Buffer)
    {
        return new Promise<RawResult>( (resolve, reject) =>
        {
            const mod = (request.protocol === "https:" ? https : http);
            const req = mod.request(request, this.OnRequestIssued.bind(this, resolve, reject));

            req.on('error', reject);
            if(body !== undefined)
                req.write(body);
            req.end();
        });
    }

    private MapRequestHeaders(headers: RequestHeaders): http.OutgoingHttpHeaders
    {
        return {
            Authorization: headers.Authorization,
            "Content-Length": headers["Content-Length"],
            "Content-Type": headers["Content-Type"],
            Host: headers.Host,
            "User-Agent": headers["User-Agent"]
        };
    }

    private MapResponseHeaders(headers: http.IncomingHttpHeaders): ResponseHeaders
    {
        return {
            "Access-Control-Expose-Headers": headers["access-control-expose-headers"],
            "Cache-Control": headers["cache-control"],
            "Content-Disposition": headers["content-disposition"],
            "Content-Type": this.ParseContentTypeHeader(headers["content-type"]),
        };
    }

    //Event handlers
    private ParseContentTypeHeader(rawHeader: string | undefined)
    {
        if(rawHeader === undefined)
            return undefined;

        const parts = rawHeader.split("; ");
        const mediaType = parts.shift();
        let charset = undefined;

        for (const part of parts)
        {
            const subParts = part.split("=");
            if(subParts[0] === "charset")
                charset = subParts[1].toLowerCase();
            else
                throw new Error("Unknown directive in Content-Type header: " + part);
        }

        return {
            mediaType: mediaType,
            charset
        } as any;
    }

    private OnRequestIssued(resolve: (value: RawResult) => void, reject: (reason: Response) => void, res: http.IncomingMessage)
    {        
        const body: Buffer[] = [];
        res.on("error", reject);
        res.on('data', chunk => body.push(chunk));
        
        res.on('end', function()
        {
            resolve({
                body: Buffer.concat(body),
                headers: res.headers,
                statusCode: res.statusCode!
            });
        });
    }
}