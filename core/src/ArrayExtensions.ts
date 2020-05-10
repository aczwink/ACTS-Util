/**
 * ACTS-Util
 * Copyright (C) 2020 Amir Czwink (amir130@hotmail.de)
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
export {};

declare global
{
    interface Array<T>
    {
        Contains: <T>(this: T[], value: T) => boolean;
        DeepClone: <T>(this: T[]) => T[];
        IsEmpty: <T>(this: T[]) => boolean;
        Remove: <T>(this: T[], index: number) => void;
    }
}

Array.prototype.Contains = function<T>(this: Array<T>, value: T)
{
    for (const it of this)
    {
        if(it === value)
            return true;
    }
    return false;
}

Array.prototype.DeepClone = function<T>(this: Array<T>)
{
    const result = [];

    for (const source of this)
    {
        let value: any = source;

        if(Array.isArray(value))
            value = value.DeepClone();
        else if(Object.IsObject(value))
            value = value.DeepClone();

        result.push(value);
    }

    return result;
}

Array.prototype.IsEmpty = function<T>(this: Array<T>)
{
    return this.length === 0;
}

Array.prototype.Remove = function<T>(this: Array<T>, index: number)
{
    this.splice(index, 1);
}