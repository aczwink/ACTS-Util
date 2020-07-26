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

import { Observable, Subscription, Observer } from "./Observable";
import { Dictionary } from "../Dictionary";

export class Subject<T> extends Observable<T>
{
    constructor()
    {
        super(newObserver => this.OnNewObserver(newObserver));

        this.subscriptions = {};
        this._nSubscriptions = 0;
        this.subscriptionCounter = 0;
    }

    //Properties
    public get nSubscriptions()
    {
        return this._nSubscriptions;
    }

    //Public methods
    public Next(data: T)
    {
        for (const key in this.subscriptions)
        {
            if(this.subscriptions.hasOwnProperty(key))
            {
                const subscription = this.subscriptions[key];
                subscription!.next(data);
            }
        }
    }

    //Private members
    private subscriptions: Dictionary<Observer<T>>;
    private _nSubscriptions: number;
    private subscriptionCounter: number;

    //Event handlers
    protected OnNewObserver(newObserver: Observer<T>): Subscription
    {
        const id = this.subscriptionCounter++;
        this.subscriptions[id] = newObserver;

        this._nSubscriptions++;

        const context = this;
        return {
            Unsubscribe()
            {
                delete context.subscriptions[id];
                context._nSubscriptions--;
            }
        };
    }
}