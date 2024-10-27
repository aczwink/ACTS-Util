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
import { Subject } from "./Observables/Subject";
import { KeyValuePair } from "./KeyValuePair";
import { EnumeratorBuilder } from "./Enumeration/EnumeratorBuilder";

export type ObservableObject<T> = {
    [KeyType in keyof T]: Subject<T>;
};

/*
This class is not actually extending object (in contrast to the other extension classes) because of compatibility with many JS libraries.
*/
export const ObjectExtensions = {

    Clone: function<T>(object: T): T
    {
        const result = {};
        Object.assign(result, object);
        return result as T;
    },

    DeepClone: function<T>(this: T): T
    {
        const result: any = {};

        for (const key in this)
        {
            if(!(this as any).hasOwnProperty(key))
                continue;
                
            let value = this[key] as any;
            if(Array.isArray(value))
                value = value.DeepClone();
            else if(ObjectExtensions.IsObject(value))
                value = value.DeepClone();

            result[key] = value;
        }

        return result as T;
    },

    Entries: function<T extends object>(object: T): EnumeratorBuilder<KeyValuePair<keyof T, T[keyof T]>>
    {
        return ObjectExtensions.OwnKeys(object).Map(k => {
            return {
                key: k,
                value: object[k]
            };
        });
    },

    Equals: function<T extends object>(this: T, other: T): boolean
    {
        const cmp = new HierarchicalComparator();
        return cmp.EqualsObject(this, other);
    },

    IsEmpty: function<T extends object>(this: T): boolean
    {
        return Object.keys(this).length === 0;
    },

    IsObject: function(value: any): boolean
    {
        return (value !== null) && (typeof(value) === "object");
    },
    
    ObserveProperties: function<T>(this: T): ObservableObject<T>
    {
        const x: any = {};
    
        return x;
    },

    OwnKeys: function<T>(object: T): EnumeratorBuilder<keyof T>
    {
        return Object.getOwnPropertyNames(object).Values() as unknown as EnumeratorBuilder<keyof T>;
    },

    Values: function<T extends object>(object: T): EnumeratorBuilder<T[keyof T]>
    {
        return ObjectExtensions.OwnKeys(object).Map(k => object[k]);
    }
};