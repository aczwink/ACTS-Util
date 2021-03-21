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
import { APILoader } from "../api/APILoader";
import { HTTPEndPointProperties } from "./HTTP";
import { HTTPRequest } from "./HTTPRequest";
import { HTTPResult } from "./HTTPRequestHandler";

export class HTTP_APILoader extends APILoader<HTTPRequest<any>, HTTPResult, HTTPEndPointProperties>
{
    public GetEndPointSetups()
    {
        const setups = super.GetEndPointSetups();
        setups.sort((a, b) => {
            const ps1 = a.properties.route.split("/");
            const ps2 = b.properties.route.split("/");

            for(let i = 0; i < Math.max(ps1.length, ps2.length); i++)
            {
                if(ps1[i] === undefined)
                    return -1;
                else if(ps2[i] === undefined)
                    return 1;

                if(ps1[i].startsWith(":") && ps2[i].startsWith(":"))
                    continue;
                if(ps1[i].startsWith(":"))
                    return 1;
                if(ps2[i].startsWith(":"))
                    return -1;
                const diff = ps1[i].localeCompare(ps2[i]);
                if(diff != 0)
                    return diff;
            }

            return 0;
        });

        //console.log("sorted");
        //console.log(setups.map(s => s.properties.route));

        return setups;
    }
}