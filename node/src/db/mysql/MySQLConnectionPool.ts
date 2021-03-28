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
import { DBDriverTransactionalQueryExecutor } from "../driver/DBDriverQueryExecutor";
import { DBResource } from "../driver/DBDriverFactory";
import { MySQLConnection } from "./MySQLConnection";
import { DBDriverConnectionPool } from "../driver/DBDriverConnectionPool";

export class MySQLConnectionPool implements DBDriverConnectionPool
{
    constructor( config: mysql.PoolConfig )
    {
        this.pool = mysql.createPool(config);
    }

	//Public methods
	public Close()
	{
		this.pool.end();
	}
	
	public async GetFreeConnection(): Promise<DBResource<DBDriverTransactionalQueryExecutor>>
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
		return {
			Close: () => conn.release(),
			value: new MySQLConnection(conn)
		};
	}

    //Private members
    private pool: mysql.Pool;
}