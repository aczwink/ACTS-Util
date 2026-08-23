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
import fs from "fs";
import path from "path";
import yaml from "yaml";
import { Writable, Readable } from "stream";

export function Promisify(stream: Readable): Promise<void>;
export function Promisify(stream: Writable): Promise<void>;
export function Promisify(stream: Readable | Writable): Promise<void>
{
    return new Promise<void>((resolve, reject) => {
        stream.on((stream instanceof Readable) ? "end" : "finish", resolve);
        stream.on("error", reject);
    });
}

export function ReadablePromise(stream: Readable)
{
    return new Promise<void>( resolve => {
        stream.on("readable", resolve);
    });
}

export async function ReadObjectFile<T>(configPath: string)
{
    const data = await fs.promises.readFile(configPath, "utf-8");
    switch(path.extname(configPath))
    {
        case ".json":
            return JSON.parse(data) as T;
        case ".yaml":
        case ".yml":
            return yaml.parse(data) as T;
    }

    throw new Error("Can't read object file: " + configPath);
}

export async function StreamToBuffer(stream: Readable): Promise<Buffer>
{
    var buffers: Buffer[] = [];
    stream.on('data', function(d){ buffers.push(d); });
    await Promisify(stream);
    return Buffer.concat(buffers);
}