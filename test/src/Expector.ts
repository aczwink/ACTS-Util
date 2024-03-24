/**
 * ACTS-Util
 * Copyright (C) 2020-2024 Amir Czwink (amir130@hotmail.de)
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
import { EqualsAny } from "acts-util-core";

export class Expector<T>
{
    constructor(private value: T)
    {
    }

    //Public methods
    public Equals(value: T, message?: string)
    {
        if(!EqualsAny(this.value, value))
            this.ThrowExpectedGot(value, message);
    }

    public ToBe(value: T, message?: string)
    {
        if(this.value !== value)
            this.ThrowExpectedGot(value, message);
    }

    //Private methods
    private ThrowExpectedGot(value: T, additionalMessage: string | undefined)
    {
        const standardMessage = "Expected: " + this.ToString(value) + ", got: " + this.ToString(this.value);
        throw new Error(standardMessage + (additionalMessage === undefined ? "" : (", " + additionalMessage)));
    }

    private ToString(value: T)
    {
        if(typeof value === "undefined")
            return "undefined";
        if(typeof value === "string")
            return value;

        if(value instanceof Date)
            return "Date (" + value.toISOString() + ")";

        if(value instanceof Set)
            return "Set {" + [...value].join(", ") + "}";
        return JSON.stringify(value);
    }
}