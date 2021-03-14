/**
 * ACTS-Util
 * Copyright (C) 2021 Amir Czwink (amir130@hotmail.de)
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

export class SymbolIteratorEnumerator<T> implements IEnumerator<T>
{
    constructor(private it: Iterator<T>)
    {
        this.Update();
    }

    //Public methods
    public HasNext(): boolean
    {
        return this.hasNext;
    }

    public Next(): T
    {
        const current = this.next;
        this.Update();
        return current;
    }

    //Private members
    private next!: T;
    private hasNext!: boolean;

    //Private methods
    private Update()
    {
        const result = this.it.next();
        this.hasNext = !(result.done === true);
        this.next = result.value;
    }
}