/**
 * ACTS-Util
 * Copyright (C) 2020-2023 Amir Czwink (amir130@hotmail.de)
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

import { IEnumerator } from "./Enumerator";
import { EnumeratorBuilder } from "./EnumeratorBuilder";

export class MapIterator<InputType, OutputType> implements IEnumerator<OutputType>
{
    constructor(private baseIterator: IEnumerator<InputType>, private func: (input: InputType) => OutputType)
    {
    }

    //Public methods
    public HasNext(): boolean
    {
        return this.baseIterator.HasNext();
    }

    public Next(): OutputType
    {
        return this.func(this.baseIterator.Next());
    }
}

declare module "./EnumeratorBuilder"
{
    interface EnumeratorBuilder<T>
    {
        Map: <U>(this: EnumeratorBuilder<T>, func: (input: T) => U) => EnumeratorBuilder<U>;
        MapAsync: <U, T>(this: EnumeratorBuilder<Promise<T>>, func: (input: T) => U) => EnumeratorBuilder<Promise<U>>;
    }
}

EnumeratorBuilder.prototype.Map = function<T, U>(this: EnumeratorBuilder<T>, func: (input: T) => U)
{
    return new EnumeratorBuilder(() => new MapIterator<T, U>(this.CreateInstance(), func));
}

EnumeratorBuilder.prototype.MapAsync = function<T, U>(this: EnumeratorBuilder<Promise<T>>, func: (input: T) => U)
{
    return this.Map(async x => {
        const result = await x;
        return func(result);
    });
}