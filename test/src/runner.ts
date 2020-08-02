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
import * as path from "path";
import { testCases } from "./main";

async function LoadAll(dirPath: string)
{
    const children = fs.readdirSync(dirPath, "utf8");
    for (const child of children)
    {
        const childPath = path.join(dirPath, child);

        const stats = fs.statSync(childPath);
        if(stats.isDirectory())
            LoadAll(childPath);
        else if(child.endsWith(".js"))
        {
            const loadPath = childPath.substr(0, childPath.length - 3);
            await import(loadPath);
        }
    }
}

async function RunAll()
{
    const dir = path.join(process.cwd(), process.argv[2]);
    await LoadAll(dir);

    let nFailedTests = 0;
    for (const testCase of testCases)
    {
        console.log("Running test: " + testCase.title);
        try
        {
            await testCase.testFunction();
        }
        catch(error)
        {
            console.log("Test '" + testCase.title + "' failed: " + error);
            nFailedTests += 1;
        }
    }

    console.log();
    console.log("Executed tests: " + testCases.length);
    console.log("Failed tests: " + nFailedTests);
}

RunAll();