/**
 * ACTS-Util
 * Copyright (C) 2020-2024 Amir Czwink (amir130@hotmail.de)
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
import { TestRunResult } from "./Definitions";
import { GenerateTextOutput } from "./GenerateTextOutput";
import { GenerateMochaJSONOutput } from "./GenerateMochaJSONOutput";

async function LoadAll(dirPath: string)
{
    const children = fs.readdirSync(dirPath, "utf8");
    for (const child of children)
    {
        const childPath = path.join(dirPath, child);

        const stats = fs.statSync(childPath);
        if(stats.isDirectory())
            await LoadAll(childPath);
        else if(child.endsWith(".js"))
        {
            const loadPath = childPath.substr(0, childPath.length - 3);
            await import(loadPath);
        }
    }
}

async function RunAll(directoryPath: string)
{
    const dir = path.join(process.cwd(), directoryPath);
    await LoadAll(dir);

    const testExecutions: TestRunResult[] = [];
    for (const testCase of testCases)
    {
        const before = Date.now();
        let err;
        try
        {
            await testCase.testFunction();
        }
        catch(error)
        {
            err = error;
        }
        const after = Date.now();
        testExecutions.push({
            testTitle: testCase.title,
            error: err as any,
            executionDuration: after - before
        });
    }

    return testExecutions;
}

async function ExecuteAllTests()
{
    const startDate = new Date();

    const results = await RunAll(process.argv[2]);

    let text;
    switch(process.argv[3])
    {
        case "text":
        case undefined:
            text = GenerateTextOutput(results);
            break;
        case "mocha-json":
            text = GenerateMochaJSONOutput(startDate, results);
            break;
        default:
            throw new Error("Unknown format: " + process.argv[3]);
    }

    console.log(text);
}

ExecuteAllTests();