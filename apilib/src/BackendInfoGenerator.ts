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
import { Dictionary } from "acts-util-core";
import { HTTP } from "acts-util-node";
import { APIRegistryInstance } from "./APIRegistry";
import { APIControllerMetadata, ParameterMetadata } from "./Metadata";

export class BackendInfoGenerator
{
    //Public methods
    public Generate(apiControllersMetadata: APIControllerMetadata[])
    {
        const result: Dictionary<HTTP.OperationStructure> = {};

        for (const apiControllerMetadata of apiControllersMetadata)
        {
            for (const operation of apiControllerMetadata.operations)
            {
                const route = apiControllerMetadata.baseRoute + (operation.route === undefined ? "" : "/" + operation.route);
                const operationId = APIRegistryInstance.GenerateOperationId(route, operation.httpMethod);

                result[operationId] = {
                    parameters: operation.parameters.Values()
                        .Map(this.MapParameterMetadata.bind(this, apiControllerMetadata.common?.parameters))
                        .Map(x => x.Values()).Flatten()
                        .ToArray()
                };
            }
        }

        return result;
    }

    //Private methods
    private MapParameterMetadata(commonParameters: ParameterMetadata[] | undefined, pm: ParameterMetadata): HTTP.ParameterStructure[]
    {
        switch(pm.source)
        {
            case "body":
                return [{
                    name: pm.name,
                    source: "body"
                }];
            case "body-prop":
            case "form-field":
                return [{
                    name: pm.name,
                    source: "body-prop"
                }];
            case "common-data":
                return commonParameters!.Values()
                    .Map(x => this.MapParameterMetadata(undefined, x).Values())
                    .Flatten().ToArray();
            case "header":
                return [{
                    name: pm.name,
                    source: "header"
                }];
            case "path":
                return [{
                    name: pm.name,
                    source: "path"
                }];
            case "query":
                return [{
                    name: pm.name,
                    source: "query"
                }];
            case "request":
                return [{
                    name: pm.name,
                    source: "request"
                }];
        }
    }
}