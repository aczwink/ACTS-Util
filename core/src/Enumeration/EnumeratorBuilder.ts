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

import { Dictionary } from "../Dictionary";
import { IEnumerator } from "./Enumerator";

type ExtractPromiseType<T> = T extends Promise<infer U> ? U : T;

export class EnumeratorBuilder<T>
{
    constructor(private iteratorInstantiator: () => IEnumerator<T>)
    {
    }

    //Public methods
    public Accumulate( func: (accumulator: T, currentValue: T) => T )
    {
        const it = this.CreateInstance();
        return this.ReduceImpl(it, func, it.Next());
    }

    public Any()
    {
        const it = this.CreateInstance();
        return it.HasNext();
    }

    public Count()
    {
        return this.Reduce((sum, _) => sum+1, 0);
    }

    public CreateInstance()
    {
        return this.iteratorInstantiator();
    }

    public First()
    {
        const it = this.CreateInstance();
        return it.Next();
    }

    public FirstOrUndefined()
    {
        const it = this.CreateInstance();
        if(it.HasNext())
            return it.Next();
        return undefined;
    }

    public ForEach( func: (value: T) => void)
    {
        const it = this.CreateInstance();
        while(it.HasNext())
            func(it.Next());
    }

    public Distinct( selector: (element: T) => (number | string | (number | string)[]) )
    {
        const map = new Map<number | string, T>();

        const it = this.CreateInstance();
        while(it.HasNext())
        {
            const elem = it.Next();
            let k = selector(elem);
            if(Array.isArray(k))
                k = "[" + k.join(",") + "]";

            if(!map.has(k))
                map.set(k, elem);
        }

        return map.Values();
    }

    public OrderBy( selector: (element: T) => number )
    {
        const result = this.ToArray();
        result.SortBy(selector);
        return result.Values();
    }

    public OrderByDescending( selector: (element: T) => number )
    {
        const result = this.ToArray();
        result.SortByDescending(selector);
        return result.Values();
    }

    public PromiseAll(maxConcurrency: number = Number.POSITIVE_INFINITY): Promise<ExtractPromiseType<T>[]>
    {
        if(maxConcurrency < Number.POSITIVE_INFINITY)
            return this.PromiseAllConcurrencyLimited(maxConcurrency);
        return Promise.all(this.ToArray()) as Promise<ExtractPromiseType<T>[]>;
    }

    public Reduce<U>( func: (accumulator: U, currentValue: T) => U, initialValue: U )
    {
        return this.ReduceImpl(this.CreateInstance(), func, initialValue);
    }

    public Sorted(sorter: (a: T, b: T) => number)
    {
        const tmp = this.ToArray();
        tmp.sort(sorter);
        return tmp.Values();
    }

    public ToArray()
    {
        const it = this.CreateInstance();
        const result = [];

        while(it.HasNext())
            result.push(it.Next());

        return result;
    }

    public ToDictionary<U>( keySelector: (value: T) => number | string, valueSelector: (value: T) => U)
    {
        const result: Dictionary<U> = {};

        const it = this.CreateInstance();
        while(it.HasNext())
        {
            const next = it.Next();
            result[keySelector(next)] = valueSelector(next);
        }

        return result;
    }

    public ToSet()
    {
        const it = this.CreateInstance();
        const result = new Set<T>();

        while(it.HasNext())
            result.add(it.Next());

        return result;
    }

    //Private methods
    private PromiseAllConcurrencyLimited(maxConcurrency: number): Promise<ExtractPromiseType<T>[]>
    {
        const it = this.CreateInstance();
        return new Promise( (resolve, reject) => {
            let nRunning = 0;
            let index = 0;
            const results: ExtractPromiseType<T>[] = [];

            function Finished(i: number, data: ExtractPromiseType<T>)
            {
                results[i] = data;
                nRunning--;
                Schedule();
            }

            function Run(i: number, next: T)
            {
                if(next instanceof Promise)
                {
                    next.catch(reject);
                    next.then(data => Finished(i, data));
                }
                else
                    Finished(i, next as ExtractPromiseType<T>);
            }

            function Schedule()
            {
                while((nRunning < maxConcurrency) && it.HasNext())
                {
                    nRunning++;
                    Run(index++, it.Next());
                }

                if(!it.HasNext() && (nRunning == 0))
                    resolve(results);
            }

            Schedule();
        });
    }

    private ReduceImpl<U>( it: IEnumerator<T>, func: (accumulator: U, currentValue: T) => U, initialValue: U )
    {
        let accumulator = initialValue;
        while(it.HasNext())
            accumulator = func(accumulator, it.Next());

        return accumulator;
    }

    //Support for standard iterators
    *[Symbol.iterator]()
    {
        const instance = this.CreateInstance();
        while(instance.HasNext())
            yield instance.Next();
    };
}