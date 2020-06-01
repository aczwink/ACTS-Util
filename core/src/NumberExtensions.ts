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
export {};

declare global
{
    interface Number
    {
        FormatBinaryPrefixed: (this: number, suffix?: string) => string;
    }
}

Number.prototype.FormatBinaryPrefixed = function(this: number, suffix?: string)
{
	let num = this;

	if(suffix === undefined)
		suffix = "B";
	
    const suffices = ['','Ki','Mi','Gi','Ti','Pi','Ei','Zi'];
	for(var i = 0; i < suffices.length; i++)
	{
		if(Math.abs(num) < 1024.0)
			return num.toFixed(2) + " " + suffices[i] + suffix;
		num /= 1024.0;
	}
	return num.toFixed(2) + " Yi" + suffix;
}