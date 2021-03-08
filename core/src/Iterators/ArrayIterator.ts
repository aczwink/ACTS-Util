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

export class ArrayIterator<T> extends Enumerator<T>
{
    constructor(private array: T[])
    {
        super();
        
        this.index = 0;
    }

    //Public methods
    public HasNext(): boolean
    {
        return this.index < this.array.length;
    }

    public Next(): T
    {
        return this.array[this.index++];
    }

    //Private members
    private index: number;
}