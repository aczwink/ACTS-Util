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
import "acts-util-core";
import * as path from "path";

import { FileSystem, DirectoryEntry } from "./FileSystem";

export class VirtualRootFileSystem implements FileSystem
{
    constructor(private wrappedFileSystem: FileSystem, private root: string)
    {
    }

    //Public methods
    public CreateDirectory(dirPath: string): Promise<void>
    {
        return this.wrappedFileSystem.CreateDirectory(this.MapPath(dirPath));
    }

    public DeleteDirectory(dirPath: string): Promise<void>
    {
        return this.wrappedFileSystem.DeleteDirectory(this.MapPath(dirPath));
    }

    public DeleteFile(filePath: string): Promise<void>
    {
        return this.wrappedFileSystem.DeleteFile(this.MapPath(filePath));
    }

    public Exists(nodePath: string): Promise<boolean>
    {
        return this.wrappedFileSystem.Exists(this.MapPath(nodePath));
    }

    public ListDirectoryContents(dirPath: string): Promise<DirectoryEntry[]>
    {
        return this.wrappedFileSystem.ListDirectoryContents(this.MapPath(dirPath));
    }

    public ReadFile(filePath: string)
    {
        return this.wrappedFileSystem.ReadFile(this.MapPath(filePath));
    }

    public WriteFile(filePath: string)
    {
        return this.wrappedFileSystem.WriteFile(this.MapPath(filePath));
    }

    //Private methods
    private CreateAbsPath(root: string, subPath: string)
    {
        const absPath = path.join(root, subPath);
    
        const rootParts = root.TrimRight("/").split("/");
        const absParts = absPath.TrimRight("/").split("/");
        if(absParts.length < rootParts.length)
            throw new Error("Permission denied");
        for(let i = 0; i < rootParts.length; i++)
        {
            if(rootParts[i] !== absParts[i])
                throw new Error("Permission denied");
        }
    
        return absPath;
    }

    private MapPath(nodePath: string)
    {
        return this.CreateAbsPath(this.root, nodePath);
    }
}