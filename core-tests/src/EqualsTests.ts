/**
 * ACTS-Util
 * Copyright (C) 2020-2026 Amir Czwink (amir130@hotmail.de)
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

import { EqualsAny } from "@aczwink/acts-util-core";
import { Expect, It } from "@aczwink/acts-util-test";

It("Equals with cycle in objects", () => {
    const a = {
        obj: {}
    };
    const b = {
        obj: {}
    };

    a.obj = a;
    b.obj = b;

    Expect(EqualsAny(a, b)).ToBe(true);
});

It("Equals with cycle in objects and additional property", () => {
    const a = {
        obj: {},
        bla: "blub"
    };
    const b = {
        obj: {},
        bla: "bla"
    };

    a.obj = a;
    b.obj = b;

    Expect(EqualsAny(a, b)).ToBe(false);
});