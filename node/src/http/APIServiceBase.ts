/**
 * ACTS-Util
 * Copyright (C) 2022-2023 Amir Czwink (amir130@hotmail.de)
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
import { AbsURL } from "acts-util-core";
import { HTTPMethod, RequestHeaders, RequestSender } from "./RequestSender";
import { ResponseHeaders } from "./Response";

interface RequestData
{
    path: string;
    method: HTTPMethod;
    query?: object;
    body?: object;
    responseType: "blob" | "json";
    successStatusCode: number;
    formatRules: any[];
}

export class APIServiceBase
{
    constructor(private backendHost: string, private backendPort: number, private backendProtocol: "http" | "https")
    {
        this._globalHeaders = {};
    }

    //Properties
    public get globalHeaders()
    {
        return this._globalHeaders;
    }

    //Public methods
    public async SendAPIRequest(requestData: RequestData)
    {
        const response = await this.SendRequest(requestData, this._globalHeaders);
        return {
            statusCode: response.statusCode,
            data: response.body
        };
    }

    public async SendRequest(requestData: RequestData, headers: RequestHeaders)
    {
        const headersCopy = headers.Clone();
        if(requestData.body !== undefined)
        {
            if(headersCopy["Content-Type"] === undefined)
            headersCopy["Content-Type"] = "application/json";
        }
        const body = this.FormatRequestBody(requestData.body, headersCopy["Content-Type"]);
        if(requestData.body !== undefined)
        {
            if(headersCopy["Content-Length"] === undefined)
            headersCopy["Content-Length"] = Buffer.byteLength(body);
        }

        const requestSender = new RequestSender;
        const response = await requestSender.SendRequest({
            body,
            headers: headersCopy,
            method: requestData.method,
            url: new AbsURL({
                host: this.backendHost,
                path: requestData.path,
                port: this.backendPort,
                protocol: this.backendProtocol,
                queryParams: requestData.query as any,
            })
        });

        return {
            statusCode: response.statusCode,
            body: (response.statusCode === 204) ? undefined : this.FormatResponseBody(response.body, requestData.responseType, response.headers)
        };
    }

    //Private variables
    private _globalHeaders: RequestHeaders;

    //Private methods
    private FormatRequestBody(body: object | undefined, contentType?: string): Buffer
    {
        if((contentType === "application/json") && (body !== undefined))
            return Buffer.from(JSON.stringify(body), "utf-8");
        return Buffer.alloc(0);
    }

    private FormatResponseBody(body: Buffer, responseType: "blob" | "json", responseHeaders: ResponseHeaders)
    {
        if(responseType === "blob")
            return body;

        let encoding = responseHeaders["Content-Type"]?.charset ?? "utf-8";
        if( (responseHeaders["Content-Type"]?.mediaType !== "application/json") )
            throw new Error("Illegal content type for parsing JSON: " + responseHeaders["Content-Type"]);
        return JSON.parse(body.toString(encoding));
    }
}