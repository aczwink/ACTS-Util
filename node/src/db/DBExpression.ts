/**
 * ACTS-Util
 * Copyright (C) 2022-2024 Amir Czwink (amir130@hotmail.de)
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

interface NowExpressionDefinition
{
    type: "CurrentDateTime";
}
export type DatabaseExpressionDefinition = NowExpressionDefinition;

export class DatabaseExpressionContainer
{
    constructor(private exprDef: DatabaseExpressionDefinition)
    {
    }

    public ToQueryRepresentation()
    {
        return this.ToString(this.exprDef);
    }

    //Private methods
    private ToString(exprDef: DatabaseExpressionDefinition)
    {
        switch(exprDef.type)
        {
            case "CurrentDateTime":
                return "NOW()";
        }
    }
}

export function CreateDatabaseExpression(expr: DatabaseExpressionDefinition)
{
    return new DatabaseExpressionContainer(expr);
}