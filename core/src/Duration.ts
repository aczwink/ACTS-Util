/**
 * ACTS-Util
 * Copyright (C) 2020,2022 Amir Czwink (amir130@hotmail.de)
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

interface Scale
{
    scale: number;
    unit: string;
}

export class Duration
{
    constructor(private ms: number)
    {
    }

    //Properties
    public get milliseconds()
    {
        return this.ms;
    }

    //Public methods
    public ToStringWithSecondPrecision()
    {
        return this.FormatToString(1);
    }

    //Override Object methods
    public toString()
    {
        return this.FormatToString(0);
    }

    //Private methods
    private FormatToString(firstUnit: number)
    {
        const scales: Scale[] = [{ scale: 1000, unit: "ms" }, { scale: 60, unit: "s" }, { scale: 60, unit: "min" }, { scale: 24, unit: "h" }, { scale: 365.25, unit: "days"}];

        let current = this.ms;
        const parts: Scale[] = [];
        for (const scale of scales)
        {
            const num = current % scale.scale;
            current = Math.floor(current / scale.scale);

            parts.push({ scale: num, unit: scale.unit });
        }

        const final = parts.Values().Skip(firstUnit).Filter(x => x.scale !== 0).Map(x => x.scale + " " + x.unit).Reverse().Join(" ");
        if(final.length === 0)
            return parts.Values().Skip(firstUnit).Map(x => x.scale + " " + x.unit).First();
        return final;
    }
}