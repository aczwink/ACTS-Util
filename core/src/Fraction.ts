/**
 * ACTS-Util
 * Copyright (C) 2021-2026 Amir Czwink (amir130@hotmail.de)
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

function GreatestCommonDivisor(a: number, b: number): number
{
    if(b == 0)
        return a;
    return GreatestCommonDivisor(b, a % b);
}

function Reduce(num: number, den: number)
{
    const gcd = GreatestCommonDivisor(num, den);
    return new Fraction( num / gcd, den / gcd);
}

export class Fraction
{
    constructor(public readonly num: number, public readonly den: number)
    {
    }

    //Public methods
    public Add(rhs: Fraction)
    {
        return Reduce(this.num * rhs.den + rhs.num * this.den, this.den * rhs.den);
    }

    public Eval()
    {
        return this.num / this.den;
    }

    public Min(other: Fraction)
    {
        if(this.Eval() < other.Eval())
            return this;
        return other;
    }

    public Negate(): Fraction
    {
        return new Fraction(-this.num, this.den);
    }

    public Scale(factor: number): Fraction
    {
        return Reduce(this.num * factor, this.den);
    }

    public Subtract(minuend: Fraction)
    {
        return this.Add(minuend.Negate());
    }

    public ToString()
    {
        return this.num + "/" + this.den;
    }
}