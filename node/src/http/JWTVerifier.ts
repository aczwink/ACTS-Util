/**
 * ACTS-Util
 * Copyright (C) 2024-2026 Amir Czwink (amir130@hotmail.de)
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
import jwt, { JwtHeader, SigningKeyCallback } from "jsonwebtoken";
import { Request } from "./Request";
import { RequestHandler } from "./RequestHandler";
import { DataResponse } from "./Response";
import { Dictionary } from "@aczwink/acts-util-core";

export class JWTVerifier implements RequestHandler
{
    constructor(private jwks: { keys: (crypto.webcrypto.JsonWebKey & { kid: string; })[] }, private issuer: string, private audience: string, private force: boolean)
    {
        this.keys = {};
    }

    public async HandleRequest(request: Request): Promise<DataResponse | null>
    {
        if(request.headers.authorization === undefined)
        {
            if(this.force)
                return this.ReportError("Authorization header missing");
            return null;
        }
        
        const auth = request.headers.authorization;
        return await new Promise<DataResponse | null>(resolve => {
            jwt.verify(
                auth.substring("Bearer ".length),
                this.GetKey.bind(this),
                {
                    audience: this.audience,
                    issuer: this.issuer
                },
                error => {
                    if(error !== null)
                        resolve(this.ReportError(error.message));
                    else
                        resolve(null);
                }
            );
        });
    }

    //Private methods
    private GetKey(header: JwtHeader, callback: SigningKeyCallback)
    {
        if(header.kid === undefined)
        {
            callback(new Error("Illegal token"));
            return;
        }
        if(header.typ !== "at+jwt")
        {
            callback(new Error("Not an access token"));
            return;
        }

        const kid = header.kid;
        const key = this.keys[kid];
        if(key !== undefined)
        {
            callback(null, key);
            return;
        }

        const result = this.jwks.keys.find(x => x.kid === kid);
        if(result === undefined)
            callback(new Error("key not found"));
        else
        {
            const key = this.keys[kid] = crypto.createPublicKey({
                key: result,
                format: 'jwk'
            });
            callback(null, key);
        }
    }

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

    //State
    private keys: Dictionary<crypto.KeyObject>;
}