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

import { IEnumerator } from "./Enumerator";
import { EnumeratorBuilder } from "./EnumeratorBuilder";

export class FlatteningIterator<T> implements IEnumerator<T>
{
    constructor(private nestedIterator: IEnumerator<EnumeratorBuilder<T>>)
    {
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
    private current!: IEnumerator<T>;

    //Private methods
    private IterateToNext()
    {
        if(this.nestedIterator.HasNext())
        {
            this.current = this.nestedIterator.Next().CreateInstance();
            if(!this.current.HasNext())
            {
                this.IterateToNext();
                return;
            }
            this.hasCurrent = true;
        }
        else
            this.hasCurrent = false;
    }
}

declare module "./EnumeratorBuilder"
{
    interface EnumeratorBuilder<T>
    {
        Flatten: <T>(this: EnumeratorBuilder<EnumeratorBuilder<T>>) => EnumeratorBuilder<T>;
    }
}

EnumeratorBuilder.prototype.Flatten = function<T>(this: EnumeratorBuilder<EnumeratorBuilder<T>>)
{
    return new EnumeratorBuilder(() => new FlatteningIterator<T>(this.CreateInstance()));
}