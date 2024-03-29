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
import { HierarchicalComparator } from "./EqualsAny";
import { Subject } from "./Observables/Subject";
import { KeyValuePair } from "./KeyValuePair";
import { EnumeratorBuilder } from "./Enumeration/EnumeratorBuilder";

export {};

export type ObservableObject<T> = {
    [KeyType in keyof T]: Subject<T>;
};

declare global
{
    interface Object
    {
        Clone: <T>(this: T) => T;
        DeepClone: <T>(this: T) => T;
        Entries: <T extends object>(this: T) => EnumeratorBuilder<KeyValuePair<keyof T, T[keyof T]>>;
        Equals: <T extends object>(this: T, other: T) => boolean;
        IsEmpty: <T extends object>(this: T) => boolean;
        IsObject: (value: any) => boolean;
        ObserveProperties: <T>(this: T) => ObservableObject<T>;
        OwnKeys: <T>(this: T) => EnumeratorBuilder<keyof T>;
        Values: <T extends object>(this: T) => EnumeratorBuilder<T[keyof T]>;
    }
}

Object.prototype.Clone = function<T>(this: T): T
{
    const result = {};
    Object.assign(result, this);
    return result as T;
}

Object.prototype.DeepClone = function<T>(this: T)
{
    const result: any = {};

    for (const key in this)
    {
        if(!(this as any).hasOwnProperty(key))
            continue;
            
        let value = this[key] as any;
        if(Array.isArray(value))
            value = value.DeepClone();
        else if(Object.IsObject(value))
            value = value.DeepClone();

        result[key] = value;
    }

    return result as T;
}

Object.prototype.Entries = function<T extends object>(this: T)
{
    return this.OwnKeys().Map(k => {
        return {
            key: k,
            value: this[k]
        };
    });
}

Object.prototype.Equals = function<T extends object>(this: T, other: T)
{
    const cmp = new HierarchicalComparator();
    return cmp.EqualsObject(this, other);
}

Object.prototype.IsEmpty = function<T extends object>(this: T)
{
    return Object.keys(this).length === 0;
}

Object.prototype.IsObject = function(value: any)
{
    return (value !== null) && (typeof(value) === "object");
}

Object.prototype.ObserveProperties = function<T>(this: T): ObservableObject<T>
{
    const x: any = {};

    return x;
}

Object.prototype.OwnKeys = function<T>(this: T): EnumeratorBuilder<keyof T>
{
    return Object.getOwnPropertyNames(this).Values() as unknown as EnumeratorBuilder<keyof T>;
}

Object.prototype.Values = function<T extends object>(this: T): EnumeratorBuilder<T[keyof T]>
{
    return this.OwnKeys().Map(k => this[k]);
}