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

import { OpenAPI } from "@aczwink/acts-util-core";
import jwt from "jsonwebtoken";

export class OpenAPISecurityVerifier
{
    constructor(private root: OpenAPI.Root)
    {
    }

    //Public methods
    public Verify(authorizationHeader: string | undefined, operation: OpenAPI.Operation)
    {
        const security = operation.security ?? this.root.security;
        if(security === undefined)
            return undefined;
        if(security.length === 0)
            return undefined;
        if(authorizationHeader === undefined)
            return "missing Authorization header";

        for (const securityRequirement of security)
        {
            for (const securitySchemeName in securityRequirement)
            {
                if (Object.prototype.hasOwnProperty.call(securityRequirement, securitySchemeName))
                {
                    const scheme = this.root.components.securitySchemes[securitySchemeName]!;
                    
                    switch(scheme.type)
                    {
                        case "http":
                            return this.ValidateHTTPBearerAuth(authorizationHeader);
                        case "openIdConnect":
                            return this.ValidateOIDC(authorizationHeader, securityRequirement[securitySchemeName]);
                    }
                }
            }
        }

        return "Authorization header doesn't match";
    }

    //Private methods
    private ValidateHTTPBearerAuth(authorizationHeader: string)
    {
        if(!authorizationHeader.startsWith("Bearer "))
            return "Authorization header malformed";
        return undefined;
    }

    private ValidateOIDC(authorizationHeader: string, requiredScopes?: string[])
    {    
        const accessToken = jwt.decode(authorizationHeader.substring("Bearer ".length), { json: true })!;
        if((requiredScopes === undefined) || (requiredScopes.length === 0))
            return undefined;

        const scopeLine = accessToken.scope ?? "";
        const providedScopes = scopeLine.split(" ") as string[];
        for (const scope of requiredScopes)
        {
            if(!providedScopes.includes(scope))
                return "Missing scope: " + scope;
        }
        return undefined;
    }
}