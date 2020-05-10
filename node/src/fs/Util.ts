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
import { Writable, Readable } from "stream";

export function ReadablePromise(stream: Readable)
{
    return new Promise<void>( resolve => {
        stream.on("readable", resolve);
    });
}

export function Promisify(stream: Readable): Promise<void>;
export function Promisify(stream: Writable): Promise<void>;
export function Promisify(stream: Readable | Writable): Promise<void>
{
    return new Promise<void>((resolve, reject) => {
        stream.on((stream instanceof Readable) ? "end" : "finish", resolve);
        stream.on("error", reject);
    });
}