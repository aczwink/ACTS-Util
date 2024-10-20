/**
 * ACTS-Util
 * Copyright (C) 2024 Amir Czwink (amir130@hotmail.de)
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
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Request } from "./Request";
import { RequestHandler } from "./RequestHandler";
import { DataResponse } from "./Response";

export class JWTVerifier implements RequestHandler
{
    constructor(private publicKey: crypto.KeyObject, private issuer: string, private force: boolean)
    {
    }

    public async HandleRequest(request: Request): Promise<DataResponse | null>
    {
        if(request.headers.authorization === undefined)
        {
            if(this.force)
                return this.ReportError("Authorization header missing");
            return null;
        }

        try
        {
            jwt.verify(
                request.headers.authorization.substring("Bearer ".length),
                this.publicKey,
                {
                    issuer: this.issuer
                }
            );
        }
        catch(e)
        {
            if(e instanceof jwt.JsonWebTokenError)
                return this.ReportError(e.message);
            throw e;
        }

        return null;
    }

    //Private methods
    private ReportError(message: string): DataResponse
    {
        return {
            statusCode: 401,
            headers: {
                "Content-Type": {
                    mediaType: "text/html",
                    charset: "utf-8"
                }
            },
            data: message
        };
    }
}