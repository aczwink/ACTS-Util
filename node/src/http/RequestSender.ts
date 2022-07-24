/**
 * ACTS-Util
 * Copyright (C) 2020-2022 Amir Czwink (amir130@hotmail.de)
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
import { AbsURL } from "acts-util-core";
import { ResponseHeaders } from "./Response";

export interface RequestHeaders
{
    Authorization?: string;
    "Content-Type"?: "application/json";
    "Content-Length"?: number;
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
        if(request.url.protocol === "https")
            throw new Error("https is not implemented");

        const httpRequest: http.RequestOptions = {
            protocol: "http:",
            hostname: request.url.host,
            port: request.url.port,
            path: request.url.PathAndQueryToString(),
            method: request.method,
            headers: this.MapRequestHeaders(request.headers).Entries()
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
            const req = http.request(request, this.OnRequestIssued.bind(this, resolve, reject));

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
        };
    }

    private MapResponseHeaders(headers: http.IncomingHttpHeaders): ResponseHeaders
    {
        return {
            "Content-Disposition": headers["content-disposition"],
            "Content-Type": headers["content-type"] as any,
        };
    }

    //Event handlers
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