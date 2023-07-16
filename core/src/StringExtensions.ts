/**
 * ACTS-Util
 * Copyright (C) 2020-2023 Amir Czwink (amir130@hotmail.de)
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

declare global
{
    interface String
    {
        ReplaceAll: (this: string, searchValue: string, replaceValue: string) => string;
        TrimLeft: (this: string, chars: string) => string;
        TrimRight: (this: string, chars: string) => string;
    }
}

String.prototype.ReplaceAll = function(this: string, searchValue: string, replaceValue: string)
{
    let result = this;
    for(let pos = result.indexOf(searchValue); pos !== -1; pos = result.indexOf(searchValue, pos))
    {
        result = result.substring(0, pos) + replaceValue + result.substring(pos + searchValue.length);
        pos += replaceValue.length;
    }
    return result;
}

String.prototype.TrimLeft = function(this: string, chars: string)
{
    let i;
    for(i = 0; i < this.length; i++)
    {
        if(chars.indexOf(this.charAt(i)) === -1)
            break;
    }

    return this.substr(i);
}

String.prototype.TrimRight = function(this: string, chars: string)
{
    let result = this;

    while(result.length > 0)
    {
        if(chars.indexOf(result.charAt(result.length - 1)) === -1)
            break;
        result = result.slice(0, -1);
    }

    return result;
}