/**
 * ACTS-Util
 * Copyright (C) 2021-2023 Amir Czwink (amir130@hotmail.de)
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

import { EnumeratorBuilder } from "./EnumeratorBuilder";

declare module "./EnumeratorBuilder"
{
    interface EnumeratorBuilder<T>
    {
        All: (this: EnumeratorBuilder<boolean>) => boolean;
        AnyTrue: (this: EnumeratorBuilder<boolean>) => boolean;
    }
}

EnumeratorBuilder.prototype.All = function(this: EnumeratorBuilder<boolean>)
{
    return !this.Filter(x => x === false).Any();
}

EnumeratorBuilder.prototype.AnyTrue = function(this: EnumeratorBuilder<boolean>)
{
    return this.Filter(x => x === true).Any();
}