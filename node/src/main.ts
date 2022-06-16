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
import { DirectoryEntry, FileSystem } from "./fs/FileSystem";
import { EncryptedFileSystem } from "./fs/EncryptedFileSystem";
import { OSFileSystem } from "./fs/OSFileSystem";
import { VirtualRootFileSystem } from "./fs/VirtualRootFileSystem";
import { WebDAVFileSystem } from "./fs/WebDAVFileSystem";
import { Promisify } from "./fs/Util";
import { Lock } from "./Lock";
import { LockedProperty } from "./LockedProperty";
import { GlobalInjector, Injectable } from "./api/GlobalInjector";
import { API } from "./api/_namespace";
import { HTTP_APILoader } from "./http/HTTP_APILoader";
import { Request } from "./http/Request";
import { Factory } from "./http/Factory";
import { DBFactory } from "./db/DBFactory";
import { DBResource } from "./db/driver/DBDriverFactory";
import { DBQueryExecutor } from "./db/DBQueryExecutor";
import { DBConnectionPool } from "./db/DBConnectionPool";
import { DBTransactionalQueryExecutor } from "./db/DBTransactionalQueryExecutor";
import { HTTPRequestSender } from "./http/HTTPRequestSender";
import { CreateTempDir, CreateTempFile } from "./fs/Temp";
import { ModuleLoader } from "./ModuleLoader";
import * as OpenAPI from "./openapi/Specification";

//Exports
import * as HTTP_OperationStructure from "./http/OperationStructure";
import * as HTTP_Response from "./http/Response";
import * as HTTP_Result from "./http/Result";
import * as HTTP_RouterRequestHandler from "./http/RouterRequestHandler";
import * as HTTP_UploadedFile from "./http/UploadedFile";
export namespace HTTP
{
    export import CreateResult = HTTP_Result.CreateResult;
    export import ParameterStructure = HTTP_OperationStructure.ParameterStructure;
    export import OperationStructure = HTTP_OperationStructure.OperationStructure;
    export import ResponseHeaders = HTTP_Response.ResponseHeaders;
    export import RouterRequestHandler = HTTP_RouterRequestHandler.RouterRequestHandler;
    export import UploadedFile = HTTP_UploadedFile.UploadedFile;
}

export {
    API,
    CreateTempDir,
    CreateTempFile,
    DBConnectionPool,
    DBFactory,
    DBResource,
    DBQueryExecutor,
    DBTransactionalQueryExecutor,
    DirectoryEntry,
    EncryptedFileSystem,
    Factory,
    FileSystem,
    GlobalInjector,
    HTTP_APILoader,
    Request as HTTPRequest,
    HTTPRequestSender,
    Injectable,
    Lock,
    LockedProperty,
    ModuleLoader,
    OpenAPI,
    OSFileSystem,
    Promisify,
    VirtualRootFileSystem,
    WebDAVFileSystem,
};