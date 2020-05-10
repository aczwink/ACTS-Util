import { OSFileSystem } from "./dist/fs/OSFileSystem";
import { FileSystem } from "./dist/fs/FileSystem";
import { VirtualRootFileSystem } from "./dist/fs/VirtualRootFileSystem";
import { WebDAVFileSystem } from "./dist/fs/WebDAVFileSystem";
import { EncryptedFileSystem } from "./dist/fs/EncryptedFileSystem";
import { Promisify } from "./dist/fs/Util";

async function AsyncMethod(fs: FileSystem)
{
    const dirname = "/b";
    const filename = "bla";
    const filepath = dirname + "/" + filename;

    if(!await fs.Exists(dirname))
        await fs.CreateDirectory(dirname);

    if(await fs.Exists(filepath))
        await fs.DeleteFile(filepath);
    
    const writer = fs.WriteFile(filepath);
    const data = "blabliblub";
    writer.write(data);
    writer.end();
    await Promisify(writer);

    console.log(await fs.ListDirectoryContents(dirname));

    const reader = await fs.ReadFile(filepath);
    reader.setEncoding("utf8");
    reader.on("data", data => console.log(data, data.length));
    await Promisify(reader);

    await fs.DeleteFile(filepath);
    await fs.DeleteDirectory(dirname);
}

const os = new VirtualRootFileSystem(new OSFileSystem(), "/home/amir/Schreibtisch/tstconn/");
const key = Buffer.alloc(32);
const enc = new EncryptedFileSystem(os, key);

AsyncMethod(enc);