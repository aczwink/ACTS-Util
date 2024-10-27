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

import { OpenAPI } from "acts-util-core";
import jwt from "jsonwebtoken";

export class OpenAPISecurityVerifier
{
    constructor(private root: OpenAPI.Root)
    {
    }

    //Public methods
    public Verify(authorizationHeader: string | undefined, operation: OpenAPI.Operation)
    {
        if(operation.security === undefined)
            return undefined;
        if(authorizationHeader === undefined)
            return "missing Authorization header";

        for (const security of operation.security)
        {
            for (const securitySchemeName in security)
            {
                if (Object.prototype.hasOwnProperty.call(security, securitySchemeName))
                {
                    const scheme = this.root.components.securitySchemes[securitySchemeName]!;
                    
                    switch(scheme.type)
                    {
                        case "http":
                            throw new Error("Method not implemented.");
                        case "openIdConnect":
                        {
                            const requiredScopes = security[securitySchemeName];
    
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
                }
            }
        }

        return "Authorization header doesn't match";
    }
}