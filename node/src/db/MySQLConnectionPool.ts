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
import mysql from "mysql";
import { MySQLPoolConnection } from "./MySQLPoolConnection";

export class MySQLConnectionPool
{
    constructor( config: mysql.PoolConfig )
    {
        this.pool = mysql.createPool(config);
    }

	//Public methods
	public async CheckConfig()
	{
		const connection = await this.GetFreeConnection();

		this.CheckGlobalVariable(connection, "innodb_checksums", "1"); //make sure bit-rot detection is enabled
		this.CheckAllVariables(connection, "time_zone", "+00:00"); //make sure database works with utc

		connection.Release();
	}

	public Close()
	{
		this.pool.end();
    }
    
    public async GetFreeConnection()
	{
		let promise = new Promise<mysql.PoolConnection>( (resolve, reject) => {
			this.pool.getConnection(function(err, connection)
			{
				if (err)
					reject(err);
				else
					resolve(connection);
			});
		});
		let conn = await promise;
		return new MySQLPoolConnection(conn);
	}

	//Private methods
	private CheckAllVariables(connection: MySQLPoolConnection, variable: string, expectedValue: string)
	{
		this.CheckVariable(connection, variable, expectedValue, ["@@global", "@@local", "@@session"])
	}

	private CheckGlobalVariable(connection: MySQLPoolConnection, variable: string, expectedValue: string)
	{
		this.CheckVariable(connection, variable, expectedValue, ["@@global"])
	}

	private async CheckVariable(connection: MySQLPoolConnection, variable: string, expectedValue: string, varTypes: string[])
	{
		for (let index = 0; index < varTypes.length; index++)
		{
			const varType = varTypes[index];

			const [{result}] = await connection.Query("SELECT " + varType + "." + variable + " AS result");

			if(result != expectedValue)
				throw new Error("Database variable '" + variable + "' has wrong value: " + result + " Expected: " + expectedValue);
		}
	}

    //Private members
    private pool: mysql.Pool;
}