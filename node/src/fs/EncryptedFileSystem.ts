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
import * as crypto from "crypto";
import * as fs from "fs";
import { tmpdir } from "os";
import { isAbsolute, join } from "path";
import { Stream, Writable } from "stream";

import { FileSystem, DirectoryEntry, ReadFileOptions, NodeAttributes } from "./FileSystem";

const AUTH_TAG_NAME_SIZE = 4;
const AUTH_TAG_DATA_SIZE = 16;
const AES_BLOCK_SIZE = 16;

interface FilePublicMetadataJson
{
    version: number;
    nonce: string;
    authTag: string;
}

interface FilePublicMetadata
{
    nonce: Buffer;
    authTag: Buffer;
}

class DecrypterStream extends Stream.Transform
{
    constructor(private encryptionKey: Buffer)
    {
        super();
    }
    
    //Public methods
    _flush(callback: (error?: Error | null, data?: any) => void)
    {
        const buffer = this.decipher!.final();
        callback(null, buffer);
    }

    _transform(chunk: any, encoding: string, callback: (error?: Error | null, data?: any) => void): void
    {
        if(this.publicMetaDataSize === undefined)
        {
            if(chunk.length < 4)
                throw new Error("IMPLEMENT THIS CORRECTLY");
            this.publicMetaDataSize = chunk.readUInt32BE(0);

            chunk = chunk.subarray(4);
        }
        if( (this.publicMetaDataSize !== undefined) && (this.publicMetadata === undefined) )
        {
            if(chunk.length < this.publicMetaDataSize)
                throw new Error("IMPLEMENT THIS CORRECTLY");

            const string = chunk.subarray(0, this.publicMetaDataSize).toString("utf8");
            const json = JSON.parse(string);
            this.publicMetadata = {
                authTag: Buffer.from(json.authTag, "base64"),
                nonce: Buffer.from(json.nonce, "base64")
            };

            this.decipher = crypto.createDecipheriv("aes-256-gcm", this.encryptionKey, this.publicMetadata.nonce, { authTagLength: AUTH_TAG_DATA_SIZE });
            this.decipher.setAuthTag(this.publicMetadata.authTag);

            chunk = chunk.subarray(this.publicMetaDataSize);
        }

        const buffer = this.decipher!.update(chunk);
        callback(null, buffer);
    }

    //Private members
    private publicMetaDataSize?: number;
    private publicMetadata?: FilePublicMetadata;
    private decipher?: crypto.DecipherGCM;
}

class TempThenWriteWriter extends Stream.Writable
{
    constructor(encryptionKey: Buffer, private targetStream: Writable)
    {
        super();

        this.finalCallback = undefined;

        const randomString = crypto.randomBytes(12).toString("hex");
        this.tempFilePath = join(tmpdir(), randomString);

        this.tempFileWriter = fs.createWriteStream(this.tempFilePath);

        this.nonce = crypto.randomBytes(16);
        this.cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, this.nonce, { authTagLength: AUTH_TAG_DATA_SIZE} );

        this.tempFileWriter.on("close", () =>
        {
            this.OnEncryptionFinished(this.cipher.getAuthTag());
        });
    }

    //Public methods
    public _final(callback: (error?: Error | null) => void): void
    {
        const encrypted = this.cipher.final();
        this.tempFileWriter.end(encrypted);
        this.finalCallback = callback;
    }

    public _write(chunk: any, encoding: string, callback: (error?: Error | null) => void): void
    {
        const encrypted = this.cipher.update(chunk);
        this.tempFileWriter.write(encrypted, callback);
    }

    //Private members
    private nonce: Buffer;
    private tempFilePath: string;
    private tempFileWriter: fs.WriteStream;
    private cipher: crypto.CipherGCM;
    private finalCallback?: (error?: Error | null) => void;

    //Private methods
    private OnEncryptionFinished(authTag: Buffer)
    {
        const publicMetadata: FilePublicMetadataJson = {
            version: 1,
            nonce: this.nonce.toString("base64"),
            authTag: authTag.toString("base64")
        };

        this.WriteJSON(this.targetStream, publicMetadata);

        fs.createReadStream(this.tempFilePath).pipe(this.targetStream).on("finish", () => this.finalCallback!());
    }

    private WriteJSON(file: Writable, data: object)
    {
        const json = JSON.stringify(data);
        const encodedData = Buffer.from(json, "utf8");

        const lenBuffer = Buffer.alloc(4);
        lenBuffer.writeUInt32BE(encodedData.length, 0);
        file.write(lenBuffer);

        file.write(encodedData);
    }
}

export class EncryptedFileSystem implements FileSystem
{
    constructor(private underlyingFileSystem: FileSystem, private encryptionKey: Buffer)
    {
    }

    //Public methods
    public CreateDirectory(dirPath: string): Promise<void>
    {
        return this.underlyingFileSystem.CreateDirectory(this.EncryptPath(dirPath));
    }

    public DeleteDirectory(dirPath: string): Promise<void>
    {
        return this.underlyingFileSystem.DeleteDirectory(this.EncryptPath(dirPath));
    }

    public DeleteFile(filePath: string)
    {
        return this.underlyingFileSystem.DeleteFile(this.EncryptPath(filePath));
    }

    public Exists(nodePath: string): Promise<boolean>
    {
        return this.underlyingFileSystem.Exists(this.EncryptPath(nodePath));
    }
    
    public async ListDirectoryContents(dirPath: string)
    {
        const encryptedPath = this.EncryptPath(dirPath);
        const entries = await this.underlyingFileSystem.ListDirectoryContents(encryptedPath);

        return entries.map(entry => {
            const mappedEntry: DirectoryEntry = {
                fileName: this.DecryptPath(join(encryptedPath, entry.fileName)),
            };
            return mappedEntry;
        });
    }

    public QueryAttributes(nodePath: string): Promise<NodeAttributes>
    {
        throw new Error("Method not implemented.");
    }

    public async ReadFile(filePath: string, options?: ReadFileOptions)
    {
        if(options !== undefined)
            throw new Error("NOT IMPLEMENTED");
            
        const stream = await this.underlyingFileSystem.ReadFile(this.EncryptPath(filePath));
        return stream.pipe(new DecrypterStream(this.encryptionKey));
    }

    public WriteFile(filePath: string)
    {
        return new TempThenWriteWriter(this.encryptionKey, this.underlyingFileSystem.WriteFile(this.EncryptPath(filePath)));
    }

    //Private methods
    private ComputeDirectoryId(path: string)
    {
        const hasher = crypto.createHash("sha384");
        hasher.update(Buffer.from(path, "utf-8"));
        return hasher.digest().slice(0, AES_BLOCK_SIZE);
    }

    private DecryptPath(encryptedPath: string)
    {
        return this.ProcessPath(encryptedPath, false);
    }

    private DecryptPathSegment(segment: string, parentPath: string)
    {
        const parentDirectoryId = this.ComputeDirectoryId(parentPath);

        const buffer = Buffer.from(segment, "hex");
        const authTag = Buffer.alloc(AUTH_TAG_NAME_SIZE);
        buffer.copy(authTag);

        const decipher = crypto.createDecipheriv("aes-256-gcm", this.encryptionKey, parentDirectoryId);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(buffer.slice(AUTH_TAG_NAME_SIZE));
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString("utf8");
    }

    private EncryptPath(path: string)
    {
        return this.ProcessPath(path, true);
    }

    private EncryptPathSegment(segment: string, parentPath: string)
    {
        const parentDirectoryId = this.ComputeDirectoryId(parentPath);

        const cipher = crypto.createCipheriv("aes-256-gcm", this.encryptionKey, parentDirectoryId, { authTagLength: AUTH_TAG_NAME_SIZE } );
        let encrypted = cipher.update(Buffer.from(segment, "utf-8"));
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        const authTag = cipher.getAuthTag();
        const result = Buffer.concat([authTag, encrypted]);

        return result.toString("hex");
    }

    private ProcessPath(path: string, encrypt: boolean)
    {
        if(!isAbsolute(path))
            throw new Error("Path must be absolute");

        const segments = path.TrimRight("/").split("/");
        const processedSegments = [];

        let parentPath = "/";
        for(let i = 1; i < segments.length; i++)
        {
            const processed = encrypt ? this.EncryptPathSegment(segments[i], parentPath) : this.DecryptPathSegment(segments[i], parentPath);
            processedSegments.push( processed );
            parentPath = join(parentPath, encrypt ? segments[i] : processed);
        }

        return "/" + processedSegments.join("/");
    }
}