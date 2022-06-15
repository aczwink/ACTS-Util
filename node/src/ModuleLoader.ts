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
import fs from "fs";
import path from "path";

export class ModuleLoader
{
    //Public methods
    public async FindModuleFiles(dirPath: string, extension: string = ".js"): Promise<string[]>
    {
        const filePaths = [];

        const children = await fs.promises.readdir(dirPath, "utf-8");
        for (const child of children)
        {
            const childPath = path.join(dirPath, child);
            const stats = await fs.promises.stat(childPath);
            
            if(stats.isDirectory())
            {
                const childrenOfChild = await this.FindModuleFiles(childPath, extension);
                filePaths.push(...childrenOfChild);
            }
            else if(child.endsWith(extension))
                filePaths.push(childPath);
        }
        return filePaths;
    }

    public async LoadDirectory(dirPath: string)
    {
        const filePaths = await this.FindModuleFiles(dirPath);
        return await filePaths.Values().Map(this.LoadModule.bind(this)).PromiseAll();
    }

    public async LoadModule(filePath: string)
    {
        return await import(filePath);
    }
}