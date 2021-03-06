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
import http from "http";


export class HTTPRequestSender
{
    //Public methods
    public async DataRequest<ResultType>(request: http.RequestOptions, data?: any)
    {
        if(request.headers === undefined)
            request.headers = {};
        if(request.headers["Content-Type"] === undefined)
            request.headers["Content-Type"] = "application/json";

        const response = await this.SendRequest(request, data === undefined ? undefined : Buffer.from(JSON.stringify(data), "utf-8"));
        return JSON.parse(response.toString("utf-8")) as ResultType;
    }

    public SendRequest(request: http.RequestOptions, data?: Buffer)
    {
        if(request.headers === undefined)
            request.headers = {};
        if((request.headers["Content-Length"] === undefined) && (data !== undefined))
            request.headers["Content-Length"] = Buffer.byteLength(data);
            
        return new Promise<Buffer>( (resolve, reject) =>
        {
            const req = http.request(request, this.OnRequestIssued.bind(this, resolve, reject));
            req.on('error', reject);
            if(data !== undefined)
                req.write(data);
            req.end();
        });
    }

    //Event handlers
    private OnRequestIssued(resolve: (value?: Buffer) => void, reject: (reason?: any) => void, res: http.IncomingMessage)
    {
        if (res.statusCode! < 200 || res.statusCode! >= 300)
            return reject(new Error('statusCode=' + res.statusCode));
        
        const body: Buffer[] = [];
        res.on('data', chunk => body.push(chunk));
        
        res.on('end', function()
        {
            resolve(Buffer.concat(body));
        });
    }
}