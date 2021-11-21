/**
 * ACTS-Util
 * Copyright (C) 2021 Amir Czwink (amir130@hotmail.de)
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

export interface DBTable
{
    readonly id: string;
    readonly name: string;
}

export interface Column
{
    table: DBTable;
    column: string;
}

export interface SpecialColumn
{
    special: "count";
}

export interface LeafCondition
{
    table: DBTable;
    column: string;
    operator: "=" | "LIKE";
    constant: number | string;
}

export interface CombinedCondition
{
    combination: "AND" | "OR";
    conditions: (LeafCondition | CombinedCondition)[];
}

interface JoinCondition
{
    column: string;
    operator: "=";
}

export interface JoinConditionWithTable extends JoinCondition
{
    joinTable: DBTable;
    joinTableColumn: string;
}

export interface JoinConditionWithConstant extends JoinCondition
{
    joinValue: number;
}

export interface Join
{
    type: "INNER" | "LEFT";
    tableName: string;
    conditions: (JoinConditionWithConstant | JoinConditionWithTable)[];
}

export interface Grouping
{
    table: DBTable;
    columnName: string;
}

export interface DBQueryBuilder
{
    limit?: number;
    offset?: number;

    AddCondition(condition: LeafCondition | CombinedCondition): void;
    AddGrouping(grouping: Grouping): void;
    AddJoin(join: Join): DBTable;
    CreateSQLQuery(): string;
    SetPrimaryTable(name: string): DBTable;
    SetColumns(columns: SpecialColumn | Column[]): void;
}