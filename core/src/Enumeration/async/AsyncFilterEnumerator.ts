/**
 * ACTS-Util
 * Copyright (C) 2024 Amir Czwink (amir130@hotmail.de)
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

import { AsyncEnumerator } from "./AsyncEnumerator";
import { AsyncEnumeratorExpression } from "./AsyncEnumeratorExpression";

export class AsyncFilterEnumerator<InputType, OutputType extends InputType> implements AsyncEnumerator<OutputType>
{
    constructor(private baseIterator: AsyncEnumerator<InputType>, private predicate: (value: InputType) => boolean)
    {
    }

    public GetCurrentValue(): OutputType
    {
        return this.current;
    }

    public async MoveForward(): Promise<boolean>
    {
        while(await this.baseIterator.MoveForward())
        {
            const current = this.baseIterator.GetCurrentValue();
            if(this.predicate(current))
            {
                this.current = current as OutputType;
                return true;
            }
        }
        return false;
    }

    //State
    private current!: OutputType;
}

declare module "./AsyncEnumeratorExpression"
{
    interface AsyncEnumeratorExpression<T>
    {
        Filter: <OutputType = T>(this: AsyncEnumeratorExpression<T>, predicate: (value: T) => boolean) => AsyncEnumeratorExpression<OutputType>;
        NotUndefined: <T>(this: AsyncEnumeratorExpression<T | undefined>) => AsyncEnumeratorExpression<T>;
    }
}

AsyncEnumeratorExpression.prototype.Filter = function<InputType, OutputType extends InputType>(this: AsyncEnumeratorExpression<InputType>, predicate: (value: InputType) => boolean)
{
    return new AsyncEnumeratorExpression(() => new AsyncFilterEnumerator<InputType, OutputType>(this.CreateEnumerator(), predicate));
}

AsyncEnumeratorExpression.prototype.NotUndefined = function<T>(this: AsyncEnumeratorExpression<T | undefined>)
{
    return this.Filter<T>( x => x !== undefined);
}