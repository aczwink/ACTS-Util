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
import { DateTime } from "../../DateTime";
import { DBDriverConnectionPool } from "./DBDriverConnectionPool";
import { DBDriverTransactionalQueryExecutor } from "./DBDriverQueryExecutor";
import { DBQueryBuilder } from "./DBQueryBuilder";

export interface DBResource<T>
{
    value: T;
    Close: () => void;
}

export interface ConnectionConfig
{
    host: string;
    username: string;
    password: string;
    defaultDatabase?: string;
}

export interface PoolConfig extends ConnectionConfig
{
    maxNumberOfConnections?: number;
}

export interface DBDriverFactory
{
    CreateQueryBuilder(): DBQueryBuilder;
    CreateConnection(config: ConnectionConfig): Promise<DBResource<DBDriverTransactionalQueryExecutor>>;
    CreateConnectionPool(config: PoolConfig): Promise<DBResource<DBDriverConnectionPool>>;
    ParseDateTime(dt: string): DateTime;
}