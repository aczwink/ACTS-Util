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

import { Dictionary } from "../main";

export abstract class ForwardIterator<T>
{
    //Abstract
    abstract HasNext(): boolean;
    abstract Next(): T;

    //Public methods
    public Accumulate( func: (accumulator: T, currentValue: T) => T )
    {
        return this.Reduce(func, this.Next());
    }

    public ForEach( func: (value: T) => void)
    {
        while(this.HasNext())
            func(this.Next());
    }

    public PromiseAll()
    {
        return Promise.all(this.ToArray());
    }

    public Reduce<U>( func: (accumulator: U, currentValue: T) => U, initialValue: U )
    {
        let accumulator = initialValue;
        while(this.HasNext())
            accumulator = func(accumulator, this.Next());

        return accumulator;
    }

    public ToArray()
    {
        const result = [];

        while(this.HasNext())
            result.push(this.Next());

        return result;
    }

    public ToDictionary<U>( keySelector: (value: T) => string, valueSelector: (value: T) => U)
    {
        const result: Dictionary<U> = {};

        while(this.HasNext())
        {
            const next = this.Next();
            result[keySelector(next)] = valueSelector(next);
        }

        return result;
    }

    public ToSet()
    {
        const result = new Set<T>();

        while(this.HasNext())
            result.add(this.Next());

        return result;
    }
}