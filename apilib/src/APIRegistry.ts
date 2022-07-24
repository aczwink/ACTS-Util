/**
 * ACTS-Util
 * Copyright (C) 2022 Amir Czwink (amir130@hotmail.de)
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
import { v5 as uuidv5 } from 'uuid';
import { Dictionary } from "acts-util-core";

export type HTTPMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

export interface APIRegistryInterface
{
    readonly endPointTargets: Dictionary<Function>;
}

class APIRegistryClass implements APIRegistryInterface
{
    constructor()
    {
        this._endPointTargets = {};
    }

    //Properties
    public get endPointTargets()
    {
        return this._endPointTargets;
    }

    //Public methods
    public GenerateOperationId(route: string, httpMethod: HTTPMethod)
    {
        const name = [route, httpMethod].join(".");
        const namespaceUUID = "201936df-ceac-4a26-be42-a343f0b3071e"; //UUIDv4 for namespace "acts-util-apilib"
    
        return uuidv5(name, namespaceUUID);
    }

    public RegisterEndPoint(route: string, httpMethod: HTTPMethod, targetMethod: Function): void
    {
        const operationId = this.GenerateOperationId(route, httpMethod);
        this._endPointTargets[operationId] = targetMethod;
    }

    //Private variables
    private _endPointTargets: Dictionary<Function>;
}

export const APIRegistryInstance = new APIRegistryClass;