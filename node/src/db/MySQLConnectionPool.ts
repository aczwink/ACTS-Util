import mysql from "mysql";
import { MySQLConnection } from "./MySQLConnection";

export class MySQLConnectionPool
{
    constructor( config: mysql.PoolConfig | string )
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
    
    async GetFreeConnection()
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
		return new MySQLConnection(conn);
	}

	//Private methods
	private CheckAllVariables(connection: MySQLConnection, variable: string, expectedValue: string)
	{
		this.CheckVariable(connection, variable, expectedValue, ["@@global", "@@local", "@@session"])
	}

	private CheckGlobalVariable(connection: MySQLConnection, variable: string, expectedValue: string)
	{
		this.CheckVariable(connection, variable, expectedValue, ["@@global"])
	}

	private async CheckVariable(connection: MySQLConnection, variable: string, expectedValue: string, varTypes: string[])
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