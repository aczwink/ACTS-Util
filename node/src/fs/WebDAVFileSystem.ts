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
const { createClient } = require("webdav");

import { FileSystem, DirectoryEntry } from "./FileSystem";

export class WebDAVFileSystem implements FileSystem
{
    constructor(url: string, userName: string, password: string)
    {
        this.connection = createClient(url, {
            username: userName,
            password: password,
        });
    }

    //Public methods
    public async CreateDirectory(dirPath: string): Promise<void>
    {
        await this.connection.createDirectory(dirPath);
    }

    public async DeleteDirectory(dirPath: string): Promise<void>
    {
        await this.connection.deleteFile(dirPath);
    }

    public async DeleteFile(filePath: string): Promise<void>
    {
        await this.connection.deleteFile(filePath);
    }

    public async Exists(nodePath: string): Promise<boolean>
    {
        return await this.connection.exists(nodePath);
    }

    public async ListDirectoryContents(dirPath: string): Promise<DirectoryEntry[]>
    {
        const directoryItems = await this.connection.getDirectoryContents(dirPath);
        return directoryItems.map( (item:any) => {
            return {
                fileName: item.basename
            };
        });
    }

    public ReadFile(filePath: string)
    {
        return this.connection.createReadStream(filePath);
    }

    public WriteFile(filePath: string)
    {
        return this.connection.createWriteStream(filePath);
    }

    //Private members
    private connection: any;
}