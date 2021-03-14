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

import { EnumeratorBuilder } from "./Enumeration/EnumeratorBuilder";
import { SymbolIteratorEnumerator } from "./Enumeration/SymbolIteratorEnumerator";
import { KeyValuePair } from "./KeyValuePair";

export {};

declare global
{
    interface Map<K, V>
    {
        Entries: (this: Map<K, V>) => EnumeratorBuilder<KeyValuePair<K, V>>;
    }
}

Map.prototype.Entries = function<K, V>(this: Map<K, V>)
{
    return new EnumeratorBuilder(() => new SymbolIteratorEnumerator(this.entries())).Map(kv => ({
        key: kv[0],
        value: kv[1]
    }));
}