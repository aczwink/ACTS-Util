/**
 * ACTS-Util
 * Copyright (C) 2022-2026 Amir Czwink (amir130@hotmail.de)
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
import { ModuleLoader } from "@aczwink/acts-util-node";
import { OpenAPIGenerator } from "./OpenAPIGenerator";
import { SourceFileAnalyzer } from "./SourceFileAnalyzer";
import { TypeCatalog } from "./TypeCatalog";
import { BackendInfoGenerator } from "./BackendInfoGenerator";
import { Dictionary, OpenAPI } from "@aczwink/acts-util-core";

export class OpenAPIGenerationOrchestrator
{
    //Public methods
    public async Generate(sourcePath: string, destPath: string, securitySchemes: Dictionary<OpenAPI.SecurityScheme>, globalSecurityRequirement: OpenAPI.SecurityRequirement | undefined, compilerOptions: ts.CompilerOptions)
    {
        const moduleLoader = new ModuleLoader;
        const sourceFiles = await moduleLoader.FindModuleFiles(sourcePath, ".ts");

        compilerOptions.noEmit = true;

        const program = ts.createProgram({
            rootNames: sourceFiles,
            options: compilerOptions
        });
        let emitResult = program.emit();

        let allDiagnostics = ts
            .getPreEmitDiagnostics(program)
            .concat(emitResult.diagnostics);

        allDiagnostics.forEach(diagnostic => {
            if (diagnostic.file) {
            let { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
            let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
            } else {
            console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
            }
        });
        let exitCode = emitResult.emitSkipped ? 1 : 0;
        if(exitCode)
        {
            console.log("Typescript does not compile. Bailing out...");
            process.exit(exitCode);
        }

        const typeCatalog = new TypeCatalog(program.getTypeChecker());

        const apiDefs = [];
        for (const sourceFile of program.getSourceFiles())
        {
            if(!sourceFile.isDeclarationFile)
            {
                const analyzer = new SourceFileAnalyzer(typeCatalog);
                const sourceFileApiDefs = analyzer.Analyze(sourceFile, sourceFile.fileName.substr(process.cwd().length));
                apiDefs.push(...sourceFileApiDefs);
            }  
        }

        const oapigen = new OpenAPIGenerator(typeCatalog);
        const oapiobj = oapigen.Generate(apiDefs, securitySchemes, globalSecurityRequirement);

        const outputData = JSON.stringify(oapiobj, undefined, 4);
        await fs.promises.writeFile(destPath + ".json", outputData, "utf-8");

        const backendInfo = new BackendInfoGenerator;
        const backendInfoObj = backendInfo.Generate(apiDefs);

        const backendOutputData = JSON.stringify(backendInfoObj, undefined, 4);
        await fs.promises.writeFile(destPath + "-structure.json", backendOutputData, "utf-8");
    }
}