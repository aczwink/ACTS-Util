/**
 * ACTS-Util
 * Copyright (C) 2020-2022 Amir Czwink (amir130@hotmail.de)
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

export class HierarchicalComparator
{
    constructor()
    {
        this.equal = new Map<any, Set<any>>();
    }

    //Public methods
    public EqualsAny(v1: any, v2: any)
    {
        if(typeof v1 === typeof v2)
        {
            //typeof null is "object" -.-
            if(v1 === null)
                return v2 === null;
            if(v2 === null)
                return false;

            if(v1 instanceof Date)
            {
                if(v2 instanceof Date)
                    return v1.valueOf() === v2.valueOf();
                return false;
            }

            if(v1 instanceof Set)
                return this.EqualsSet(v1, v2);
                
            if(Array.isArray(v1))
                return this.EqualsArray(v1, v2);

            if(typeof v1 === "object")
                return this.EqualsObject(v1, v2);

            return v1 === v2;
        }

        return false;
    }

    public EqualsArray<T>(v1: T[], v2: T[])
    {
        if(v1.length != v2.length)
            return false;
        for(var i = 0; i < v1.length; i++)
        {
            if(!this.EqualsAny(v1[i], v2[i]))
                return false;
        }
        return true;
    }

    public EqualsObject<T extends object>(v1: T, v2: T)
    {
        if(this.IsAlreadyEqual(v1, v2))
            return true;
        this.AssumeEqual(v1, v2);

        if(Object.is(v1, v2))
            return true;

        const keys1 = Object.keys(v1);
        const keys2 = Object.keys(v2);

        if(keys1.length != keys2.length)
            return false;

        for (let index = 0; index < keys1.length; index++)
        {
            const key = keys1[index];
            if(!this.EqualsAny((v1 as any)[key], (v2 as any)[key]))    
                return false;
        }
        return true;
    }

    public EqualsSet<T>(v1: Set<T>, v2: Set<T>)
    {
        if(v1.size != v2.size)
            return false;

        for (const it of v1)
        {
            if(v2.has(it))
                continue;

            let found = false;
            for (const it2 of v2)
            {
                if(this.EqualsAny(it, it2))
                {
                    found = true;
                    break;
                }
            }

            if(!found)
                return false;
        }

        return true;
    }

    //Private members
    private equal: Map<any, Set<any>>;

    //Private methods
    private AssumeEqual(v1: any, v2: any)
    {
        this.SetEqual(v1, v2);
        this.SetEqual(v2, v1);
    }

    private IsAlreadyEqual(v1: any, v2: any)
    {
        const set = this.equal.get(v1);
        return (set !== undefined) && set.has(v2);
    }

    private SetEqual(v1: any, v2: any)
    {
        const set = this.equal.get(v1);
        if(set === undefined)
            this.equal.set(v1, new Set([v2]));
        else
            set.add(v2);
    }
}

export function EqualsAny(v1: any, v2: any)
{
    const cmp = new HierarchicalComparator();
    return cmp.EqualsAny(v1, v2);
}