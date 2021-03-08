/**
 * ACTS-Util
 * Copyright (C) 2020-2021 Amir Czwink (amir130@hotmail.de)
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

import { Expect, It } from "acts-util-test";

It("Array to set", () => {
    Expect( [1, 2, 3, 4, 5, 4, 3, 2, 1, 0].Values().ToSet() )
        .Equals( new Set([0, 1, 2, 3, 4, 5]) );
});

It("Array filter", () => {
    Expect( [-1, 1, 2, -4, 3, 0, -3].Values().Filter(x => x > 0).ToArray() )
        .Equals( [1, 2, 3] );
});

It("Array map and reduce", () => {
    const gaussian_sum = 4 * (4 + 1) / 2;
    Expect( ["1", "2", "3", "4"].Values().Map(value => parseInt(value)).Accumulate( (x, y) => x+y ) )
        .Equals( gaussian_sum );
});

It("Flattening", () => {
    const input = [
        [1, 2, 3],
        [4, 5],
        [6, 7, 8, 9]
    ];

    Expect( input.Values().Map(x => x.Values() ).Flatten().ToArray() ).Equals( [1, 2, 3, 4, 5, 6, 7, 8, 9] );
});

It("Standard iterator", () => {
    const input = [1, 2, 3];

    const found = [];
    for (const value of input.Values())
        found.push(value);

    Expect(found).Equals(input);
});