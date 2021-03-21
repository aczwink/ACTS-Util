import { DBQueryExecutor } from "./DBQueryExecutor";
import { DBConnectionPool } from "./DBConnectionPool";
/**
 * ACTS-Util
 * Copyright (C) 2020-2021 Amir Czwink (amir130@hotmail.de)
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

import { ConnectionConfig, DBDriverFactory, DBResource, PoolConfig } from "./driver/DBDriverFactory";
import { MySQLFactory } from "./mysql/MySQLFactory";

type DBType = "mysql";

interface ConnectionConfigWithType extends ConnectionConfig
{
    type: DBType;
}

interface PoolConfigWithType extends PoolConfig
{
    type: DBType;
}

export class DBFactory
{
    //Public methods
    public async CreateConnection(config: ConnectionConfigWithType): Promise<DBResource<DBQueryExecutor>>
    {
        const driverFactory = this.GetDriverFactory(config.type);
        const conn = await driverFactory.CreateConnection(config);

        return {
            Close: conn.Close,
            value: new DBQueryExecutor(conn.value)
        };
    }
    
    public async CreateConnectionPool(config: PoolConfigWithType): Promise<DBResource<DBConnectionPool>>
    {
        const driverFactory = this.GetDriverFactory(config.type);
        const pool = await driverFactory.CreateConnectionPool(config);

        return {
            Close: pool.Close,
            value: new DBConnectionPool(pool.value),
        };
    }

    //Private methods
    private GetDriverFactory(type: DBType): DBDriverFactory
    {
        switch(type)
        {
            case "mysql":
                return new MySQLFactory;
        }
    }
}