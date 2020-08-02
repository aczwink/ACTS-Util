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

export class Duration
{
    constructor(private ms: number)
    {
    }

    //Override Object methods
    public toString()
    {
        const scales = [{ scale: 1000, unit: "ms" }, { scale: 60, unit: "s" }, { scale: 60, unit: "min" }, { scale: 24, unit: "h" } ];

        let current = this.ms;
        const parts = [];
        for (const scale of scales)
        {
            const num = current % scale.scale;
            if(num)
            {
                parts.unshift(scale.unit);
                parts.unshift(num);
            }
            current = Math.floor(current / scale.scale);
        }

        if(current)
        {
            parts.unshift("days");
            parts.unshift(current);
        }
            
        return parts.join(" ");
    }
}