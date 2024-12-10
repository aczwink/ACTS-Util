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
import bodyParser from "body-parser";
import cors from "cors";
import express, { NextFunction } from "express";
import multer from "multer";
import { RequestListener } from "http";
import { Readable } from "stream";
import { Request } from "./Request";
import { RequestHandler } from "./RequestHandler";

import { RequestHandlerChain } from "./RequestHandlerChain";
import { DataResponse } from "./Response";
import { UploadedFile, UploadedFileRef } from "./UploadedFile";
import { Promisify } from "../fs/Util";
import { DateTime } from "../DateTime";
import { ObjectExtensions } from "acts-util-core";

export class ExpressRequestHandlerChain implements RequestHandlerChain
{
    constructor(uploadPath?: string)
    {
        this.app = express();
        if(uploadPath === undefined)
        {
            this.multer = multer({
                storage: multer.memoryStorage()
            });
        }
        else
        {
            this.multer = multer({
                storage: multer.diskStorage({
                    destination: uploadPath
                })
            });
        }  
        this.requestHandlers = [];
        this.hasTrailingThirdParty = false;
    }

    //Properties
    public get requestListener(): RequestListener
    {
        return this.app;
    }

    //Public methods
    public AddBodyParser(): void
    {
        this.app.use(bodyParser.json());
    }

    public AddCORSHandler(trustedOrigins: string[]): void
    {
        this.app.use(cors({ origin: trustedOrigins }));
    }

    public AddDynamicCORSHandler(check: (origin: string) => boolean): void
    {
        this.app.use(
            cors({
                origin: (origin, callback) => {
                    callback(null, check(origin ?? ""))
                }
            })
        );
    }

    public AddRequestHandler(requestHandler: RequestHandler): void
    {
        if(this.requestHandlers.length === 0)
            this.app.use(this.OnRequestIncoming.bind(this));
        this.requestHandlers.push(requestHandler);

        this.hasTrailingThirdParty = false;
    }

    public AddThirdPartyHandler(handler: Function): void
    {
        this.app.use(handler as any);
        this.hasTrailingThirdParty = true;
    }

    //Private variables
    private app: express.Express;
    private multer: multer.Multer;
    private requestHandlers: RequestHandler[];
    private hasTrailingThirdParty: boolean;

    //Private methods
    private async HandleRequest(req: express.Request, res: express.Response, next: NextFunction)
    {
        if(req.files !== undefined)
        {
            if(Array.isArray(req.files))
            {
                for (const file of req.files)
                {
                    if(file.buffer === undefined)
                    {
                        const uf: UploadedFileRef = {
                            filePath: file.path,
                            mediaType: file.mimetype,
                            originalName: file.originalname,
                        };
                        req.body[file.fieldname] = uf;
                    }
                    else
                    {
                        const uf: UploadedFile = {
                            originalName: file.originalname,
                            mediaType: file.mimetype,
                            buffer: file.buffer
                        };
                        req.body[file.fieldname] = uf;
                    }
                }
            }
        }

        const request: Request = {
            body: req.body,
            headers: req.headers,
            httpMethod: req.method,
            protocol: req.protocol,
            hostName: req.hostname,
            port: req.socket.localPort!,
            routePath: req.originalUrl,
            ip: req.ip ?? "",
        };

        let response: DataResponse | null = null;
        for (const handler of this.requestHandlers)
        {
            response = await handler.HandleRequest(request);
            if(response != null)
                break;
        }

        if(response != null)
            this.SendReponse(response, res);
        else if(this.hasTrailingThirdParty)
            next();
        else
        {
            this.SendReponse({
                data: "Request could not be handled",
                headers: {
                    "Content-Type": {
                        mediaType: "text/html",
                        charset: "utf-8"
                    }
                },
                statusCode: 500,
            }, res);
        }
    }

    private MapResult(result: any): any
    {
        if(Array.isArray(result))
            return result.map(this.MapResult.bind(this));

        if(typeof result === "object")
        {
            if(result === null)
                return null;

            if(result instanceof Date)
                return result.toISOString();

            if(result instanceof DateTime)
                return result.ToISOString();
            
            return ObjectExtensions.Entries(result).ToDictionary( (kv: any) => kv.key, (kv: any) => this.MapResult(kv.value))
        }

        return result;
    }

    private async SendReponse(response: DataResponse, res: express.Response)
    {
        res.status(response.statusCode);

        for (const key in response.headers)
        {
            if (Object.prototype.hasOwnProperty.call(response.headers, key))
            {
                if(key === "Content-Type")
                {
                    const ct = response.headers["Content-Type"]!;
                    const stringVersion = ct.charset === undefined ? "" : ("; charset=" + ct.charset);
                    res.setHeader("Content-Type", ct.mediaType + stringVersion);
                }
                else
                    res.setHeader(key, (response.headers as any)[key]);
            }
        }

        if(response.data instanceof Buffer)
        {
            res.write(response.data);
            res.end();
        }
        else if(response.data instanceof Readable)
        {
            await Promisify(response.data.pipe(res));
            res.end();
        }
        else
        {
            res.json(this.MapResult(response.data));
            res.end();
        }
    }

    //Event handlers
    private async OnRequestIncoming(req: express.Request, res: express.Response, next: NextFunction)
    {
        if(req.headers["content-type"]?.startsWith("multipart/form-data;"))
        {
            const formDataHandler = this.multer.any();
            const context = this;
            formDataHandler(req, res,
                function (err: any)
                {
                    if(err)
                        throw err;
                    context.HandleRequest(req, res, next);
                }
            );
        }
        else
            this.HandleRequest(req, res, next);
    }
}