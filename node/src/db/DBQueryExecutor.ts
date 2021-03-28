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

import { DBDriverQueryExecutor, SQLArgType } from "./driver/DBDriverQueryExecutor";

interface SQLResult
{
  [key: string]: any;
}

interface InsertResult
{
	/**
	 * The id from auto increment.
	 */
	insertId: number;
}

interface UpdateResult
{
	/**
	 * The number of rows that met the update condition.
	 */
	affectedRows: number;
	/**
	 * The number of rows that were not only affected but actually changed.
	 */
	changedRows: number;
}

export class DBQueryExecutor implements DBDriverQueryExecutor
{
    constructor(private dbConn: DBDriverQueryExecutor)
    {
    }

    //Public methods
    public DeleteRows(tableName: string, condition: string, ...parameters: SQLArgType[])
	{
		return this.Query("DELETE FROM " + tableName + " WHERE " + condition, parameters);
	}

	public InsertRow(table: string, values: any): Promise<InsertResult>
	{
		const keys = [];
		const questionMarks = [];
		const queryArgs = [];
		for (const key in values)
		{
			if (values.hasOwnProperty(key))
			{
				keys.push(key);
				const value = values[key];

				if(value === "NOW()")
					questionMarks.push(value);
				else
				{
					questionMarks.push("?");
					queryArgs.push(value);
				}
			}
		}
		let query = "INSERT INTO " + table + " (" + keys.join(",") + ") VALUES (" + questionMarks.join(",") + ")";
		return this.Query(query, queryArgs);
	}
    
    public Select<T = SQLResult>(query: string, ...args: SQLArgType[]): Promise<T[]>
    {
      return this.dbConn.Query(query, args);
    }
    
    public async SelectOne<T = SQLResult>(query: string, ...args: SQLArgType[]): Promise<T | undefined>
    {
      const result = await this.dbConn.Query(query, args);
      return result[0];
    }

    public Query(query: string, args?: SQLArgType[]): Promise<any>
    {
      return this.dbConn.Query(query, args);
	}
	
	public UpdateRows(table: string, values: any, condition: string, ...args: SQLArgType[]): Promise<UpdateResult>
	{
        const setters = [];
        const setterArgs = [];
		for (const key in values)
		{
			if (values.hasOwnProperty(key))
			{
				let value = values[key];
				if(value === "NOW()")
				{
					setters.push(key + " = " + value);
				}
				else
				{
					setters.push(key + " = ?");
					setterArgs.push(value);
				}
			}
		}
		const query = "UPDATE " + table + " SET " + setters.join(", ") + " WHERE " + condition;
		return this.Query(query, setterArgs.concat(args));
	}
}