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
import mysql from "mysql";

import { MySQLConnectionPool } from "./MySQLConnectionPool";
import { ConnectionConfig, DBDriverFactory, DBResource, PoolConfig } from "../driver/DBDriverFactory";
import { DBDriverQueryExecutor, DBDriverTransactionalQueryExecutor } from "../driver/DBDriverQueryExecutor";
import { MySQLConnection } from "./MySQLConnection";
import { DBDriverConnectionPool } from "../driver/DBDriverConnectionPool";

export class MySQLFactory implements DBDriverFactory
{
	//Public methods
	public async CreateConnection(config: ConnectionConfig): Promise<DBResource<DBDriverTransactionalQueryExecutor>>
	{
		const mysqlConn = mysql.createConnection({
			host: config.host,
			user: config.username,
			password: config.password,
			database: config.defaultDatabase,
			charset: "utf8mb4",
			dateStrings: true,
		});
		const conn = new MySQLConnection(mysqlConn);

		await this.CheckConfig(conn);

		return {
			Close: () => mysqlConn.end(),
			value: conn
		};
	}

    public async CreateConnectionPool(config: PoolConfig): Promise<DBResource<DBDriverConnectionPool>>
    {
        const pool = new MySQLConnectionPool({
			host: config.host,
			user: config.username,
			password: config.password,
			database: config.defaultDatabase,
			charset: "utf8mb4",
			dateStrings: true,
			connectionLimit: config.maxNumberOfConnections
		});

        const conn = await pool.GetFreeConnection();
        await this.CheckConfig(conn.value);
        conn.Close();

        return {
            Close: pool.Close.bind(pool),
            value: pool
        };
    }

    //Private methods
    private async CheckConfig(connection: DBDriverQueryExecutor)
	{
		this.CheckGlobalVariable(connection, "innodb_checksums", "1"); //make sure bit-rot detection is enabled
		this.CheckAllVariables(connection, "time_zone", "+00:00"); //make sure database works with utc
    }
    
    private CheckAllVariables(connection: DBDriverQueryExecutor, variable: string, expectedValue: string)
	{
		this.CheckVariable(connection, variable, expectedValue, ["@@global", "@@local", "@@session"])
	}

	private CheckGlobalVariable(connection: DBDriverQueryExecutor, variable: string, expectedValue: string)
	{
		this.CheckVariable(connection, variable, expectedValue, ["@@global"])
	}

	private async CheckVariable(connection: DBDriverQueryExecutor, variable: string, expectedValue: string, varTypes: string[])
	{
		for (let index = 0; index < varTypes.length; index++)
		{
			const varType = varTypes[index];

			const [{result}] = await connection.Query("SELECT " + varType + "." + variable + " AS result");

			if(result != expectedValue)
				throw new Error("Database variable '" + variable + "' has wrong value: " + result + " Expected: " + expectedValue);
		}
	}
}