/**
 * ACTS-Util
 * Copyright (C) 2021-2023 Amir Czwink (amir130@hotmail.de)
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
import { Column, CombinedCondition, ConditionOperand, DBQueryBuilder, DBTable, Grouping, Join, JoinConditionWithConstant, JoinConditionWithTable, LeafCondition, SpecialColumn } from "../driver/DBQueryBuilder";

interface JoinWithTable
{
    join: Join;
    table: DBTable;
}

export class MySQLQueryBuilder implements DBQueryBuilder
{
    constructor()
    {
        this.tableCounter = 0;
        this.conditions = [];
        this.columns = [];
        this.groupings = [];
        this.joins = [];
        this.primaryTable = null;
    }

    //Public members
    limit?: number;
    offset?: number;

    //Public methods
    public AddCondition(condition: LeafCondition | CombinedCondition): void
    {
        this.conditions.push(condition);
    }

    public AddGrouping(grouping: Grouping): void
    {
        this.groupings.push(grouping);
    }

    public AddJoin(join: Join): DBTable
    {
        const jwt: JoinWithTable = {
            join,
            table: this.CreateTable(join.tableName)
        }
        this.joins.push(jwt);
        return jwt.table;
    }

    public CreateSQLQuery(): string
    {
        if(this.primaryTable == null)
            throw new Error("Primary table not specified");

        const joins = this.joins.map(j => this.CreateJoinSQL(j)).join("\n");

        return [
            "SELECT " + this.columns.join(", "),
            `FROM ${this.primaryTable.name} ${this.primaryTable.id}`,
            joins,
            `WHERE ${this.CreateWhereSQL()}`,
            this.groupings.IsEmpty() ? "" : ("GROUP BY " + this.GroupingsToSQL()),
            this.limit === undefined ? "" : ("LIMIT " + this.limit),
            this.offset === undefined ? "" : ("OFFSET " + this.offset),
        ].Values().Map(line => line.trim()).Filter(line => line.length > 0).Join("\n");
    }

    public SetColumns(columns: SpecialColumn | Column[]): void
    {
        if(Array.isArray(columns))
        {
            this.columns = columns.map(c => c.table.id + "." + c.column);
        }
        else
        {
            this.columns = ["COUNT(*) AS count"];
        }
    }

    public SetPrimaryTable(name: string): DBTable
    {
        this.primaryTable = this.CreateTable(name);
        return this.primaryTable;
    }

    //Private members
    private tableCounter: number;
    private conditions: (LeafCondition | CombinedCondition)[];
    private columns: string[];
    private groupings: Grouping[];
    private joins: JoinWithTable[];
    private primaryTable: DBTable | null;

    //Private methods
    private ConstantToSQL(constant: string | number | null)
    {
        if(constant === null)
            return "NULL";
        if(typeof(constant) === "number")
            return constant.toString();
        return '"' + constant + '"';
    }

    private CreateConditionSQL(condition: LeafCondition | CombinedCondition): string
    {
        if("combination" in condition)
            return condition.conditions.map(this.CreateConditionSQL.bind(this)).join(" " + condition.combination + " ");
        return "(" + this.OperandToSQL(condition.operand) + " " + condition.operator + " " + this.ConstantToSQL(condition.constant) + ")";
    }

    private CreateJoinConditionSQL(j: JoinConditionWithConstant | JoinConditionWithTable)
    {
        if("joinValue" in j)
            return j.joinValue;
        return j.joinTable.id + "." + j.joinTableColumn;
    }

    private CreateJoinSQL(j: JoinWithTable)
    {
        const cond = j.join.conditions.map(c => `${j.table.id}.${c.column} ${c.operator} ` + this.CreateJoinConditionSQL(c) );
        return `${j.join.type} JOIN ${j.table.name} ${j.table.id}
            ON ${cond.join(" AND ")}`;
    }

    private CreateTable(name: string): DBTable
    {
        const n = this.tableCounter++;
        return {
            id: "t" + n,
            name
        };
    }

    private CreateWhereSQL()
    {
        if(this.conditions.length == 0)
            return "TRUE";

        return this.CreateConditionSQL({
            combination: "AND",
            conditions: this.conditions
        });
    }

    private GroupingsToSQL()
    {
        return this.groupings.Values().Map(x => x.table.id + "." + x.columnName).Join(", ");
    }

    private OperandToSQL(operand: ConditionOperand): string
    {
        if("table" in operand)
            return operand.table.id + "." + operand.column;
        return operand.function + "(" + operand.args.map(this.OperandToSQL.bind(this)).join(",") + ")";
    }
}