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
import { ArrayIterator } from "./Enumeration/ArrayIterator";
import { HierarchicalComparator } from "./EqualsAny";
import { EnumeratorBuilder } from "./Enumeration/EnumeratorBuilder";
import { ObjectExtensions } from "./ObjectExtensions";

export {};

declare global
{
    interface Array<T>
    {
        Clone: <T>(this: T[]) => T[];
        Contains: <T>(this: T[], value: T) => boolean;
        DeepClone: <T>(this: T[]) => T[];
        Equals: <T>(this: T[], other: T[]) => boolean;
        IsEmpty: <T>(this: T[]) => boolean;
        Remove: <T>(this: T[], index: number) => void;
        SortBy: <T>(this: T[], selector: (element: T) => number | string | number[]) => void;
        SortByDescending: <T>(this: T[], selector: (element: T) => number | string) => void;
        Values: <T>(this: T[]) => EnumeratorBuilder<T>;
    }
}


function SortArray<T, U extends (number | string | number[])>(array: Array<T>, selector: (element: T) => U, ascending: boolean)
{
    function diff(a: number | string, b: number | string)
    {
        if((typeof a === "number") && (typeof b === "number"))
            return a - b;
        return a.toString().localeCompare(b.toString());
    }
    function diff_arrays(a: number[], b: number[]): number
    {
        if(a.length === 0)
            return 0;
        const d = diff(a[0], b[0]);
        if(d !== 0)
            return d;
        return diff_arrays(a.slice(1), b.slice(1));
    }

    return array.sort( (a,b) => {
        const sa = selector(a);
        const sb = selector(b);

        let result;
        if(Array.isArray(sa))
            result = diff_arrays(sa, sb as number[]);
        else
            result = diff(sa, sb as number | string);
        return ascending ? result : -result;
    });
}


Array.prototype.Clone = function<T>(this: T[])
{
    return this.slice();
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
        else if(ObjectExtensions.IsObject(value))
            value = ObjectExtensions.DeepClone(value);

        result.push(value);
    }

    return result;
}

Array.prototype.Equals = function<T>(this: T[], other: T[])
{
    const cmp = new HierarchicalComparator();
    return cmp.EqualsArray(this, other);
}

Array.prototype.IsEmpty = function<T>(this: Array<T>)
{
    return this.length === 0;
}

Array.prototype.Remove = function<T>(this: Array<T>, index: number)
{
    this.splice(index, 1);
}

Array.prototype.SortBy = function<T>(this: Array<T>, selector: (element: T) => number | string | number[])
{
    return SortArray(this, selector, true);
}

Array.prototype.SortByDescending = function<T>(this: Array<T>, selector: (element: T) => number | string)
{
    return SortArray(this, selector, false);
}

Array.prototype.Values = function<T>(this: T[])
{
    return new EnumeratorBuilder(() => new ArrayIterator(this));
}