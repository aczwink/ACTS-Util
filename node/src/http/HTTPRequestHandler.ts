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
import multer from "multer";

import { ConfiguredAPIEndPoint } from "../api/APILoader";
import { HTTPEndPointProperties } from "./HTTP";
import { HTTPRequest } from "./HTTPRequest";

export interface HTTPResultData<DataType>
{
    statusCode?: number;
    headers?: http.OutgoingHttpHeaders;
    data?: DataType;
}

export type HTTPResult = HTTPResultData<object>;

export interface HTTPRequestHandlerOptions
{
    trustedOrigins: string[];
}

export interface HTTPRequestHandler
{
    readonly requestListener: http.RequestListener;
    RegisterRoute(properties: HTTPEndPointProperties, handler: (arg: HTTPRequest<any>) => Promise<HTTPResult>): void;
    RegisterRouteSetup(routeSetup: ConfiguredAPIEndPoint<HTTPRequest<any>, HTTPResult, HTTPEndPointProperties>): void;
    RegisterRouteSetups(routeSetups: ConfiguredAPIEndPoint<HTTPRequest<any>, HTTPResult, HTTPEndPointProperties>[]): void;
    RegisterUpload(_multer: multer.Multer): void;
}