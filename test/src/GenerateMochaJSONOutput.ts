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

interface MochaJSONError
{
    message: string;
    stack?: string;
}

interface MochaJSONTestResult
{
    title: string;
    fullTitle: string;
    file: string;
    duration: number;
    currentRetry: number;
    err: {};
}

function MapError(error: Error): MochaJSONError
{
    return {
        message: error.message,
        stack: error.stack
    };
}

function MapTestResult(result: TestRunResult): MochaJSONTestResult
{
    return {
        currentRetry: 0,
        duration: result.executionDuration,
        err: (result.error === undefined ? {} : MapError(result.error)),
        file: "TODO",
        fullTitle: result.testTitle,
        title: result.testTitle
    };
}

export function GenerateMochaJSONOutput(startDate: Date, results: TestRunResult[])
{
    const tests = [];
    const passes = [];
    const failures = [];
    for (const result of results)
    {
        const mapped = MapTestResult(result);
        tests.push(mapped);
        if(result.error === undefined)
            passes.push(mapped);
        else
            failures.push(mapped);
    }

    const end = new Date();
    const data = {
        stats: {
            suites: 1,
            tests: results.length,
            passes: passes.length,
            pending: 0,
            failures: results.Values().Filter(x => x.error !== undefined).Count(),
            start: startDate.toISOString(),
            end: end.toISOString(),
            duration: (end.valueOf() - startDate.valueOf())
        },
        tests,
        pending: [],
        failures,
        passes,
    };

    return JSON.stringify(data);
}