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

import { HierarchicalComparator } from "./EqualsAny";
import { EnumeratorBuilder } from "./Enumeration/EnumeratorBuilder";
import { SymbolIteratorEnumerator } from "./Enumeration/SymbolIteratorEnumerator";

export {};

declare global
{
    interface Set<T>
    {
        Equals: <T>(this: Set<T>, other: Set<T>) => boolean;
        Intersect: <T>(this: Set<T>, other: Set<T>) => Set<T>;
        IsSuperSetOf: <T>(this: Set<T>, other: Set<T>) => boolean;
        ToArray: <T>(this: Set<T>) => T[];
        Union: <T>(this: Set<T>, other: Set<T>) => Set<T>;
        Values: <T>(this: Set<T>) => EnumeratorBuilder<T>;
        Without: <T>(this: Set<T>, other: Set<T>) => Set<T>;
    }
}

Set.prototype.Equals = function<T>(this: Set<T>, other: Set<T>)
{
    const cmp = new HierarchicalComparator();
    return cmp.EqualsSet(this, other);
}

Set.prototype.Intersect = function<T>(this: Set<T>, other: Set<T>)
{
    return this.Values().Filter(x => other.has(x)).ToSet();
}

Set.prototype.IsSuperSetOf = function<T>(this: Set<T>, other: Set<T>)
{
    if(this.size < other.size)
        return false;
    for (const x of other)
    {
        if(!this.has(x))    
            return false;
    }
    return true;
}

Set.prototype.ToArray = function<T>(this: Set<T>)
{
    return [...this];
}

Set.prototype.Union = function<T>(this: Set<T>, other: Set<T>)
{
    return new Set([...this, ...other]);
}

Set.prototype.Values = function<T>(this: Set<T>)
{
    return new EnumeratorBuilder( () => new SymbolIteratorEnumerator(this.values()) );
}

Set.prototype.Without = function<T>(this: Set<T>, other: Set<T>)
{
    return this.Values().Filter(x => !other.has(x)).ToSet();
}