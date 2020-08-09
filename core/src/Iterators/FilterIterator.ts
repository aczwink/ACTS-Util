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

import { ForwardIterator } from "./ForwardIterator";

export class FilterIterator<InputType, OutputType> extends ForwardIterator<OutputType>
{
    constructor(private baseIterator: ForwardIterator<InputType>, private filter: (value: InputType) => boolean)
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

declare module "./ForwardIterator"
{
    interface ForwardIterator<T>
    {
        Filter: <OutputType = T>(this: ForwardIterator<T>, filter: (value: T) => boolean) => ForwardIterator<OutputType>;
    }
}

ForwardIterator.prototype.Filter = function<InputType extends OutputType, OutputType>(this: ForwardIterator<InputType>, filter: (value: InputType) => boolean)
{
    return new FilterIterator<InputType, OutputType>(this, filter);
}