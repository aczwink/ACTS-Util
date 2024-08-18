/**
 * ACTS-Util
 * Copyright (C) 2020-2024 Amir Czwink (amir130@hotmail.de)
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
import { MySQLQueryBuilder } from "./MySQLQueryBuilder";
import { DateTime } from "../../DateTime";

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
			supportBigNumbers: true,
			bigNumberStrings: true,
			timezone: "Z",
			typeCast: this.TypeCast.bind(this)
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
			supportBigNumbers: true,
			bigNumberStrings: true,
			timezone: "Z",
			connectionLimit: config.maxNumberOfConnections,
			typeCast: this.TypeCast.bind(this)
		});

        const conn = await pool.GetFreeConnection();
        await this.CheckConfig(conn.value);
        conn.Close();

        return {
            Close: pool.Close.bind(pool),
            value: pool
        };
	}
	
	public CreateQueryBuilder()
	{
		return new MySQLQueryBuilder;
	}

	public ParseDateTime(dt: string): DateTime
	{
		const parts = dt.split(" ");
		const dateParts = parts[0].split("-").map(x => parseInt(x));
		const timeParts = parts[1].split(":").map(x => parseInt(x));

		return DateTime.ConstructUTC(dateParts[0], dateParts[1], dateParts[2], timeParts[0], timeParts[1], timeParts[2]);
	}

    //Private methods
    private async CheckConfig(connection: DBDriverQueryExecutor)
	{
		//make sure bit-rot detection is enabled
		const checkSums = (await this.ReadVariableValue(connection, "@@global", "innodb_checksum_algorithm")) as string;
		if(checkSums.indexOf("none") != -1)
			throw new Error("Database bit rot detection is disabled!");

		await this.CheckAllVariables(connection, "time_zone", "+00:00"); //make sure database works with utc
    }
    
    private async CheckAllVariables(connection: DBDriverQueryExecutor, variable: string, expectedValue: string)
	{
		await this.CheckVariable(connection, variable, expectedValue, ["@@global", "@@local", "@@session"])
	}

	private async CheckVariable(connection: DBDriverQueryExecutor, variable: string, expectedValue: string, varTypes: string[])
	{
		for (let index = 0; index < varTypes.length; index++)
		{
			const varType = varTypes[index];

			const result = await this.ReadVariableValue(connection, varType, variable);

			if(result != expectedValue)
				throw new Error("Database variable '" + variable + "' has wrong value: " + result + " Expected: " + expectedValue);
		}
	}

	private async ReadVariableValue(connection: DBDriverQueryExecutor, varType: string, variable: string)
	{
		const [{result}] = await connection.Query("SELECT " + varType + "." + variable + " AS result");

		return result;
	}

	private TypeCast(field: mysql.UntypedFieldInfo & { type: string; length: number; string(): string | null; buffer(): Buffer | null; geometry(): mysql.GeometryType | null; }, next: () => void)
	{
		if(field.type === "DATETIME")
		{
			const dt = field.string()!;
			if(dt === "0000-00-00 00:00:00")
				return DateTime.ConstructFromUnixTimeStamp(0);
			return this.ParseDateTime(dt);
		}
		return next();
	}
}