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
import * as bodyParser from "body-parser";
import express from "express";
import cors from "cors";
import { ConfiguredAPIEndPoint } from "../api/APILoader";

import { HTTPResult, HTTPRequestHandler, HTTPRequestHandlerOptions } from "./HTTPRequestHandler";
import { HTTPEndPointProperties } from "./HTTP";
import { HTTPRequest } from "./HTTPRequest";
import { RequestListener } from "http";
import { Readable } from "stream";
import multer from "multer";

export class ExpressHTTPRequestHandler implements HTTPRequestHandler
{
    constructor(options: HTTPRequestHandlerOptions)
    {
        this.app = express();

        this.app.use(cors({ origin: options.trustedOrigins }));
        this.app.use(bodyParser.json());
    }

    //Properties
    public get requestListener(): RequestListener
    {
        return this.app;
    }

    //Public methods
    public RegisterRoute(properties: HTTPEndPointProperties, handler: (arg: HTTPRequest<any>) => Promise<HTTPResult>): void
    {
        if(properties.files === undefined)
            (this.app as any)[properties.method.toLowerCase()](properties.route, this.OnRequest.bind(this, handler));
        else
        {
            const uploadFiles = this.multer!.fields(properties.files);
            (this.app as any)[properties.method.toLowerCase()](properties.route, uploadFiles, this.OnRequest.bind(this, handler));
        }
    }

    public RegisterRouteSetup(routeSetup: ConfiguredAPIEndPoint<HTTPRequest<any>, HTTPResult, HTTPEndPointProperties>): void
    {
        this.RegisterRoute(routeSetup.properties, routeSetup.method);
    }

    public RegisterRouteSetups(routeSetups: ConfiguredAPIEndPoint<HTTPRequest<any>, HTTPResult, HTTPEndPointProperties>[]): void
    {
        routeSetups.forEach(this.RegisterRouteSetup.bind(this));
    }

    public RegisterUpload(_multer: multer.Multer)
    {
        this.multer = _multer;
    }

    //Private members
    private app: express.Express;
    private multer?: multer.Multer;

    //Private methods
    private ParseQuery(dict: any)
    {
        function isNumeric(str: string)
        {
            str = str.trim();
            if(str.length === 0)
                return false;
            return !isNaN(parseFloat(str));
        }

        for (const key in dict)
        {
            if (Object.prototype.hasOwnProperty.call(dict, key))
            {
                const value = dict[key];

                if(isNumeric(value))
                    dict[key] = parseFloat(value);
                
            }
        }
        return dict;
    }

    //Event handlers
    private async OnRequest(handler: (req: HTTPRequest<any, any>) => Promise<HTTPResult>, req: express.Request, res: express.Response)
    {
        const result = await handler({
            data: ("IsEmpty" in req.body) && req.body.IsEmpty() ? this.ParseQuery(req.query) : req.body,
            headers: req.headers,
            ip: req.ip,
            routePath: req.route.path,
            routeParams: req.params,
            files: req.files as any
        });

        if(result.statusCode !== undefined)
            res.status(result.statusCode);
        if(result.headers !== undefined)
        {
            for (const key in result.headers)
            {
                if (Object.prototype.hasOwnProperty.call(result.headers, key))
                {
                    res.setHeader(key, result.headers[key]!);
                }
            }
        }
        if(result.data !== undefined)
        {
            if(result.data instanceof Buffer)
                res.write(result.data);
            else if(result.data instanceof Readable)
                result.data.pipe(res);
            else
                res.json(result.data);
        }
        res.end();
    }
}