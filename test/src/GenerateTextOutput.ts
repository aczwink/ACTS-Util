/**
 * ACTS-Util
 * Copyright (C) 2024-2026 Amir Czwink (amir130@hotmail.de)
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
import chalk from 'chalk';
import { TestRunResult } from "./Definitions";

function DecorateWithColor(text: string, decoration: "green" | "red-bold")
{
    if(process.stdout.isTTY)
    {
        switch(decoration)
        {
            case "green":
                return chalk.green(text);
            case "red-bold":
                return chalk.red.bold(text);
        }
    }
    return text;
}

function ErrorToString(error: Error)
{
    return error.message;
}

function TestResultToString(result: TestRunResult)
{
    if(result.error === undefined)
        return DecorateWithColor("success", "green");
    return DecorateWithColor("failed", "red-bold") + " (" + ErrorToString(result.error) + ")";
}

export function GenerateTextOutput(results: TestRunResult[])
{
    const data = [];
    for (const result of results)
    {
        const text = "Result of test case '" + result.testSuite + "/" + result.testTitle + "': " + TestResultToString(result) + " file: " + result.filePath;
        data.push(text);
    }

    const succeeded = results.Values().Filter(x => x.error === undefined).Count();
    const failed = results.length - succeeded;
    data.push("Total succeeded: " + succeeded + ", failed: " + failed);

    return data.join("\n");
}