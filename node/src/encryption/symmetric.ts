/**
 * ACTS-Util
 * Copyright (C) 2023-2025 Amir Czwink (amir130@hotmail.de)
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
import crypto from "crypto";

interface ACTSUtilFormat_Header
{
    cipher: "aes-256-gcm";
    headerLength: number;
    authTag: Buffer;
    iv: Buffer;
}

const signatureField = "ACUE";

function ACTSUtilFormat_ReadHeader(opcFormatData: Buffer): ACTSUtilFormat_Header
{
    const signature = opcFormatData.toString("utf-8", 0, 4);
    if(signature !== signatureField)
        throw new Error("encoding error. invalid signature");
    const version = opcFormatData.readUInt8(4);

    const signatureLen = 5;
    const authTagLen = 16;
    switch(version)
    {
        case 0:
        {
            const ivLen = 12;
            const authTagOffset = signatureLen + ivLen;
            return {
                cipher: "aes-256-gcm",
                headerLength: signatureLen + ivLen + authTagLen,
                authTag: opcFormatData.subarray(authTagOffset, authTagOffset + authTagLen),
                iv: opcFormatData.subarray(signatureLen, authTagOffset)
            };
        }
        default:
            throw new Error("encoding error. invalid format");
    }
}

function ACTSUtilFormat_ReadHeaderAndCreateDecipher(key: Buffer, opcFormatData: Buffer)
{
    const header = ACTSUtilFormat_ReadHeader(opcFormatData);

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, header.iv, {
        authTagLength: header.authTag.length,
    });
    decipher.setAuthTag(header.authTag);

    return {
        decipher,
        headerLength: header.headerLength
    };
}

function AES256GCM_Encrypt(key: Buffer, iv: Buffer, authTagLength: number, data: Buffer)
{
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv, {
        authTagLength,
    });

    const encryptedBlocks = cipher.update(data);
    const lastBlock = cipher.final();
    const payload = Buffer.concat([cipher.getAuthTag(), encryptedBlocks, lastBlock]);
    return payload;
}

function SymmetricDecrypt(key: Buffer, actsUtilFormatData: Buffer)
{
    const result = ACTSUtilFormat_ReadHeaderAndCreateDecipher(key, actsUtilFormatData);
    const data = actsUtilFormatData.subarray(result.headerLength);
    const decipher = result.decipher;

    const decrypted = decipher.update(data);
    return Buffer.concat([decrypted, decipher.final()]);
}

function SymmetricEncrypt(key: Buffer, payload: Buffer)
{
    const versionNumber = 0;
    const header = Buffer.concat([Buffer.from(signatureField), Buffer.from([versionNumber])]);
    const iv = crypto.randomBytes(12);
    const encrypted = AES256GCM_Encrypt(key, iv, 16, payload);
    return Buffer.concat([header, iv, encrypted]);
}

export default {
    SymmetricDecrypt,
    SymmetricEncrypt
};