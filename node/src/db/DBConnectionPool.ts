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

import { DBDriverConnectionPool } from "./driver/DBDriverConnectionPool";
import { DBResource } from "./driver/DBDriverFactory";
import { DBQueryExecutor } from "./DBQueryExecutor";
import { SQLArgType } from "./driver/DBDriverQueryExecutor";
import { DBTransactionalQueryExecutor } from "./DBTransactionalQueryExecutor";

export class DBConnectionPool
{
    constructor(private pool: DBDriverConnectionPool)
    {
    }

    //Public methods
    public CreateAnyConnectionQueryExecutor()
    {
        const pool = this;
        return new DBQueryExecutor({
            async Escape(value: string)
            {
                const conn = await pool.GetFreeConnection();
                const reuslt = conn.value.Escape(value);
                conn.Close();

                return reuslt;
            },

            async Query(query: string, args?: SQLArgType[]): Promise<any>
            {
                const conn = await pool.GetFreeConnection();
                const reuslt = conn.value.Query(query, args);
                conn.Close();

                return reuslt;
            }
        });
    }

    public async GetFreeConnection(): Promise<DBResource<DBTransactionalQueryExecutor>>
    {
        const conn = await this.pool.GetFreeConnection();

        return {
            Close: conn.Close,
            value: new DBTransactionalQueryExecutor(conn.value)
        };
    }
}