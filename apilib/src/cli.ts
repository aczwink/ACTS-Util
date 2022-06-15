#!/usr/bin/env node
/**
 * ACTS-Util
 * Copyright (C) 2022 Amir Czwink (amir130@hotmail.de)
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
import path from "path";
import { ModuleLoader } from "acts-util-node";
import { OpenAPIGenerator } from "./OpenAPIGenerator";
import { SourceFileAnalyzer } from "./SourceFileAnalyzer";
import { TypeCatalog } from "./TypeCatalog";
import { OpenAPIGenerationOrchestrator } from "./OpenAPIGenerationOrchestrator";
import { APIClassGenerator } from "./APIClassGenerator";

async function ProcessInput()
{
    const args = process.argv.slice(2);
    const command = args[0];
    const sourcePath = path.resolve(args[1]);
    const destPath = path.resolve(args[2]);

    switch(command)
    {
        case "api":
            {
                const gen = new APIClassGenerator;
                await gen.Generate(sourcePath, destPath);
            }
            break;
        case "openapi":
            {
                const gen = new OpenAPIGenerationOrchestrator;
                await gen.Generate(sourcePath, destPath);
            }
            break;
    }
}

ProcessInput();