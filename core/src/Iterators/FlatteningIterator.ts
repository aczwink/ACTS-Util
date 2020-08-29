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

export class FlatteningIterator<T> extends ForwardIterator<T>
{
    constructor(private nestedIterator: ForwardIterator<ForwardIterator<T>>)
    {
        super();

        this.hasCurrent = false;
    }
    
    //Public methods
    public HasNext(): boolean
    {
        if(!this.hasCurrent || (this.hasCurrent && !this.current.HasNext()))
            this.IterateToNext();

        return this.hasCurrent && this.current.HasNext();
    }

    public Next(): T
    {
        if(!this.hasCurrent)
            this.IterateToNext();
        if(!this.hasCurrent)
            throw new Error("No more values");

        return this.current.Next();
    }

    //Private members
    private hasCurrent: boolean;
    private current!: ForwardIterator<T>;

    //Private methods
    private IterateToNext()
    {
        if(this.nestedIterator.HasNext())
        {
            this.current = this.nestedIterator.Next();
            this.hasCurrent = true;
        }
        else
            this.hasCurrent = false;
    }
}

declare module "./ForwardIterator"
{
    interface ForwardIterator<T>
    {
        Flatten: <T>(this: ForwardIterator<ForwardIterator<T>>) => ForwardIterator<T>;
    }
}

ForwardIterator.prototype.Flatten = function<T>(this: ForwardIterator<ForwardIterator<T>>)
{
    return new FlatteningIterator<T>(this);
}