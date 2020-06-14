/**
 * ACTS-Util
 * Copyright (C) 2020 Amir Czwink (amir130@hotmail.de)
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
import { Subscription } from "./Observable";
import { Dictionary } from "../Dictionary";

export type PropertyObserver<T> = (newValue: T) => void;
export class Property<T>
{
    constructor(value: T)
    {
        this.state = value;
        this.observers = {};
        this.subscriptionCounter = 0;
    }

    //Public methods
    public Get(): T
    {
        return this.state;
    }

    public Set(value: T)
    {
        const changed = this.state !== value;
        this.state = value;

        if(changed)
            this.Emit();
    }

    public Subscribe(observer: PropertyObserver<T>): Subscription
    {
        const id = this.subscriptionCounter++;
        this.observers[id] = observer;

        observer(this.state);

        const context = this;
        return {
            Unsubscribe()
            {
                delete context.observers[id];
            }
        };
    }

    //Private members
    private state: T;
    private observers: Dictionary<PropertyObserver<T>>;
    private subscriptionCounter: number;

    //Private methods
    private Emit()
    {
        for (const key in this.observers)
            this.observers[key]!(this.state);
    }
}