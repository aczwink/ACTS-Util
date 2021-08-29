import { EnumeratorBuilder } from "./Enumeration/EnumeratorBuilder";
import { SymbolIteratorEnumerator } from "./Enumeration/SymbolIteratorEnumerator";

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
export {};

interface RegExMatchEntry
{
    groups: string[];
}

declare global
{
    interface RegExp
    {
        MatchAll: (this: RegExp, content: string) => EnumeratorBuilder<RegExMatchEntry>;
    }
}

function* MatchAllIterator(regEx: RegExp, content: string)
{
    const copy = new RegExp(regEx);
    
    let match: RegExpExecArray | null;
    while ((match = copy.exec(content)) !== null)
    {
        const matchEntry: RegExMatchEntry = {
            groups: match.slice(1)
        };
        yield matchEntry;
    }
}

RegExp.prototype.MatchAll = function(this: RegExp, content: string)
{
    if(this.flags.indexOf("g") === -1)
        throw new Error("MatchAll requires g flag");

    return new EnumeratorBuilder<RegExMatchEntry>( () => new SymbolIteratorEnumerator(MatchAllIterator(this, content)) );
}