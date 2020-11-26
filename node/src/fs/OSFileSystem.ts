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
import * as fs from "fs";

import { FileSystem, DirectoryEntry, ReadFileOptions, NodeAttributes } from "./FileSystem";

export class OSFileSystem implements FileSystem
{
    //Public methods
    public CreateDirectory(dirPath: string): Promise<void>
    {
        return new Promise<void>( (resolve, reject) => {
            fs.mkdir(dirPath, error => {
                if(error !== null)
                    reject(error);
                resolve();
            });
        });
    }

    public DeleteDirectory(dirPath: string): Promise<void>
    {
        return new Promise<void>( (resolve, reject) => {
            fs.rmdir(dirPath,  (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    public DeleteFile(filePath: string): Promise<void>
    {
        return new Promise<void>( (resolve, reject) => {
            fs.unlink(filePath,  (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    public Exists(nodePath: string): Promise<boolean>
    {
        return new Promise<boolean>( resolve => fs.exists(nodePath, resolve) );
    }

    public ListDirectoryContents(dirPath: string): Promise<DirectoryEntry[]>
    {
        return new Promise<DirectoryEntry[]>( (resolve, reject) => {
            fs.readdir(dirPath, "utf8", (error, files) => {
                if(error !== null)
                    reject(error);

                const results = files.map(file => {
                    return { fileName: file };
                });
                resolve(results);
            });
        });
    }

    public async QueryAttributes(nodePath: string): Promise<NodeAttributes>
    {
        return fs.promises.stat(nodePath);
    }

    public async ReadFile(filePath: string, options?: ReadFileOptions)
    {
        return fs.createReadStream(filePath, (options === undefined) ? undefined : {
            start: options.startOffset,
            end: options.endOffset
        });
    }

    public WriteFile(filePath: string)
    {
        return fs.createWriteStream(filePath);
    }
}