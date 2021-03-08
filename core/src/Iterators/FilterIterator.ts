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

import { Enumerator } from "./Enumerator";
import { EnumeratorBuilder } from "./EnumeratorBuilder";

export class FilterIterator<InputType, OutputType> extends Enumerator<OutputType>
{
    constructor(private baseIterator: Enumerator<InputType>, private filter: (value: InputType) => boolean)
    {
        super();

        this.hasNextValue = false;
    }

    //Public methods
    public HasNext(): boolean
    {
        if(!this.hasNextValue)
            this.IterateToNextValue();

        return this.hasNextValue;
    }

    public Next(): OutputType
    {
        if(!this.hasNextValue)
            this.IterateToNextValue();
        if(!this.hasNextValue)
            throw new Error("No more values");

        this.hasNextValue = false;
        return this.nextValue;
    }

    //Private members
    private hasNextValue: boolean;
    private nextValue!: OutputType;

    //Private methods
    private IterateToNextValue()
    {
        while(this.baseIterator.HasNext())
        {
            const next = this.baseIterator.Next();
            if(this.filter(next))
            {
                (this as any).nextValue = next;
                this.hasNextValue = true;
                return;
            }
        }

        this.hasNextValue = false;
    }
}

declare module "./EnumeratorBuilder"
{
    interface EnumeratorBuilder<T>
    {
        Filter: <OutputType = T>(this: EnumeratorBuilder<T>, filter: (value: T) => boolean) => EnumeratorBuilder<OutputType>;
    }
}

EnumeratorBuilder.prototype.Filter = function<InputType extends OutputType, OutputType>(this: EnumeratorBuilder<InputType>, filter: (value: InputType) => boolean)
{
    return new EnumeratorBuilder(() => new FilterIterator<InputType, OutputType>(this.CreateInstance(), filter));
}