/**
 * ACTS-Util
 * Copyright (C) 2025 Amir Czwink (amir130@hotmail.de)
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

class AsyncMapEnumerator<InputType, OutputType> implements AsyncEnumerator<OutputType>
{
    constructor(private baseIterator: AsyncEnumerator<InputType>, private func: (value: InputType) => OutputType)
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
            this.current = this.func(current);
            return true;
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
        Map: <OutputType = T>(this: AsyncEnumeratorExpression<T>, func: (input: T) => OutputType) => AsyncEnumeratorExpression<OutputType>;
    }
}

AsyncEnumeratorExpression.prototype.Map = function<InputType, OutputType>(this: AsyncEnumeratorExpression<InputType>, func: (value: InputType) => OutputType)
{
    return new AsyncEnumeratorExpression(() => new AsyncMapEnumerator<InputType, OutputType>(this.CreateEnumerator(), func));
}