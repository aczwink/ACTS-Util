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

interface Attribute
{
    key: string;
    maxLength: number;
    value: string;
}

function AttributeToString(attribute: Attribute)
{
    return Decorate(attribute.key, "bold-underline") + ": " + attribute.value.padEnd(attribute.maxLength);
}

function Decorate(text: string, decoration: "bold-underline")
{
    if(process.stdout.isTTY)
    {
        switch(decoration)
        {
            case "bold-underline":
                return chalk.bold.underline(text);
        }
    }
    return text;
}

function ErrorToString(error: Error)
{
    return error.message;
}

function StatusToString(success: boolean)
{
    return success ? "✅" : "❌";
}

export function GenerateTextOutput(results: TestRunResult[])
{
    const data = [];

    const maxSuiteLen = results.Values().Map(x => x.testSuite.length).Max();
    const maxTitleLen = results.Values().Map(x => x.testTitle.length).Max();
    const maxFileLen = results.Values().Map(x => x.filePath.length).Max();
    for (const result of results)
    {
        const success = result.error === undefined;

        const attribs = [
            {
                key: "Suite",
                value: result.testSuite,
                maxLength: maxSuiteLen
            },
            {
                key: "Case",
                value: result.testTitle,
                maxLength: maxTitleLen
            },
            {
                key: "File",
                value: result.filePath,
                maxLength: maxFileLen
            }
        ];
        if(!success)
        {
            attribs.push({
                key: "Error",
                value: ErrorToString(result.error!),
                maxLength: 0
            });
        }

        const mapped = attribs.map(AttributeToString);
        const text = mapped.join(" | ");
        const line = StatusToString(success) + " " + text;
        data.push(line);
    }

    const succeeded = results.Values().Filter(x => x.error === undefined).Count();
    const failed = results.length - succeeded;
    data.push("Total succeeded: " + succeeded + ", failed: " + failed);

    return data.join("\n");
}