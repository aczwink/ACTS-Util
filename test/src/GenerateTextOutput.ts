/**
 * ACTS-Util
 * Copyright (C) 2024 Amir Czwink (amir130@hotmail.de)
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

import { TestRunResult } from "./Definitions";

function ErrorToString(error: Error)
{
    return error.message;
}

export function GenerateTextOutput(results: TestRunResult[])
{
    const data = [];
    for (const result of results)
    {
        const text = "Result of test case '" + result.testSuite + "/" + result.testTitle + "': " + (result.error === undefined ? "success" : "failed (" + ErrorToString(result.error) + ")" + " file: " + result.filePath);
        data.push(text);
    }

    const succeeded = results.Values().Filter(x => x.error === undefined).Count();
    const failed = results.length - succeeded;
    data.push("Total succeeded: " + succeeded + ", failed: " + failed);

    return data.join("\n");
}