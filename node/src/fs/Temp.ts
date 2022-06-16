/**
 * ACTS-Util
 * Copyright (C) 2021-2022 Amir Czwink (amir130@hotmail.de)
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
import { pseudoRandomBytes } from "crypto";
import * as fs from "fs";
import * as os from "os";
import path from "path";

export function CreateTempDir()
{
    const srcPath = os.tmpdir() + "/";
    return fs.promises.mkdtemp(srcPath, {
        encoding: "utf-8"
    });
}

export async function CreateTempFile()
{
    const srcPath = os.tmpdir();
    while(true)
    {
        const filePath = path.join(srcPath, pseudoRandomBytes(16).toString("hex"));
        const file = await fs.promises.open(filePath, "wx");

        return {
            filePath,
            file
        };
    }
}