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
import { SQLArgType } from "../driver/DBDriverQueryExecutor";

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

export class MySQLConnection
{
	constructor(private connection: mysql.Connection)
	{
	}

	//Public methods
	public Commit()
	{
		return new Promise( ( resolve, reject ) => {
			this.connection.commit( err => {
				if (err)
				{
					this.connection.rollback(function(err2) {
						reject(err2);
					});
					return reject(err);
				}
				resolve();
			});
		});
	}

    public Query( query: string, args?: SQLArgType[] ): Promise<any>
	{
		return new Promise<any>( ( resolve, reject ) => {
			this.connection.query( query, args, ( err, rows ) => {
				if ( err )
					return reject( err );
				resolve( rows );
			} );
		} );
	}

	public Rollback()
	{
		return new Promise( ( resolve, reject ) => {
			this.connection.rollback(err => {
				if(err)
					reject(err);
				else
					resolve();
			});
		});
	}

	public StartTransaction()
	{
		return new Promise( (resolve, reject) => {
			this.connection.beginTransaction( err => {
				if (err)
					reject(err);
				else
					resolve();
			});
		});
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