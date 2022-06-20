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

import { Request } from "./Request";
import { DataResponse } from "./Response";

export interface RequestHandler
{
    /**
     * Returning null indicates that this handler "passed" and the processing should be delegted to the next in the chain.
     * In case the request should not be forwarded further in the chain, for example because authorization failed, a valid response should be returned.
     */
    HandleRequest(request: Request): Promise<DataResponse | null>;
}