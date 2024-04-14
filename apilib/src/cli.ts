#!/usr/bin/env node
/**
 * ACTS-Util
 * Copyright (C) 2022-2024 Amir Czwink (amir130@hotmail.de)
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
import ts from "typescript";
import path from "path";
import { OpenAPIGenerationOrchestrator } from "./OpenAPIGenerationOrchestrator";
import { APIClassGenerator } from "./APIClassGenerator";
import { Dictionary } from "acts-util-core";
import { SecuritySchemeDef } from "./OpenAPIGenerator";

interface ConfigBase
{
    source: string;
    destination: string;
}

interface APIClassGenConfig extends ConfigBase
{
    type: "api";
    excludedStatusCodes: number[];
    header?: string;
}

interface OpenAPIGenConfig extends ConfigBase
{
    type: "openapi";
    securitySchemes: Dictionary<SecuritySchemeDef>;
}

type APILibConfig = APIClassGenConfig | OpenAPIGenConfig;

async function ProcessConfig(config: APILibConfig)
{
    const sourcePath = path.resolve(config.source);
    const destPath = path.resolve(config.destination);

    const destParentPath = path.dirname(destPath);
    try
    {
        await fs.promises.mkdir(destParentPath);
    }
    catch(e: any)
    {
        if(e.code !== "EEXIST")
            throw e;
    }

    switch(config.type)
    {
        case "api":
            {
                const gen = new APIClassGenerator(config.excludedStatusCodes.Values().ToSet());
                await gen.Generate(sourcePath, destPath, config.header);
            }
            break;
        case "openapi":
            {
                const configFile = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
                const parsedConfig = ts.parseJsonConfigFileContent(
                    configFile.config,
                    ts.sys,
                    "./"
                );

                const gen = new OpenAPIGenerationOrchestrator;
                await gen.Generate(sourcePath, destPath, config.securitySchemes, parsedConfig.options);
            }
            break;
    }
}

async function ProcessInput()
{
    const args = process.argv.slice(2);

    const configInput = await fs.promises.readFile("api.json", "utf-8");
    const configs = JSON.parse(configInput);

    if(Array.isArray(configs))
    {
        for (const config of configs)
            await ProcessConfig(config);
    }
    else
        await ProcessConfig(configs);
}

ProcessInput();