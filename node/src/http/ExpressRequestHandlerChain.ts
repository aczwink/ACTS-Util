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
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import multer from "multer";
import { RequestListener } from "http";
import { Readable } from "stream";
import { RequestHandler } from "./RequestHandler";

import { RequestHandlerChain } from "./RequestHandlerChain";
import { DataResponse } from "./Response";
import { UploadedFile } from "./UploadedFile";

export class ExpressRequestHandlerChain implements RequestHandlerChain
{
    constructor()
    {
        this.app = express();
        this.multer = multer({
            storage: multer.memoryStorage()
        });
        this.requestHandlers = [];
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

    public AddRequestHandler(requestHandler: RequestHandler): void
    {
        if(this.requestHandlers.length === 0)
            this.app.use(this.OnRequestIncoming.bind(this));
        this.requestHandlers.push(requestHandler);
    }

    //Private variables
    private app: express.Express;
    private multer: multer.Multer;
    private requestHandlers: RequestHandler[];

    //Private methods
    private async HandleRequest(req: express.Request, res: express.Response)
    {
        if(req.files !== undefined)
        {
            if(Array.isArray(req.files))
            {
                for (const file of req.files)
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

        let response: DataResponse | null = null;
        for (const handler of this.requestHandlers)
        {
            response = await handler.HandleRequest({
                body: req.body,
                httpMethod: req.method,
                protocol: req.protocol,
                hostName: req.hostname,
                port: req.socket.localPort,
                routePath: req.originalUrl,
                ip: req.ip,
            });
            if(response != null)
                break;
        }

        if(response != null)
            this.SendReponse(response, res);
        else
        {
            this.SendReponse({
                data: "Request could not be handled",
                headers: {
                    "Content-Type": "text/html; charset=utf-8"
                },
                statusCode: 500,
            }, res);
        }
    }

    private SendReponse(response: DataResponse, res: express.Response)
    {
        res.status(response.statusCode);

        for (const key in response.headers)
        {
            if (Object.prototype.hasOwnProperty.call(response.headers, key))
            {
                res.setHeader(key, (response.headers as any)[key]);
            }
        }

        if(response.data instanceof Buffer)
            res.write(response.data);
        else if(response.data instanceof Readable)
            response.data.pipe(res);
        else
            res.json(response.data);
        res.end();
    }

    //Event handlers
    private async OnRequestIncoming(req: express.Request, res: express.Response)
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
                    context.HandleRequest(req, res);
                }
            );
        }
        else
            this.HandleRequest(req, res);
    }
}