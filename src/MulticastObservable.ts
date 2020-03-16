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
import { Observer, SubscriberFunction, Subscription } from "./Observable";
import { Dictionary } from "./Dictionary";

export class MulticastObservable<T>
{
    constructor(private subscriber: SubscriberFunction<T>)
    {
        this.hasState = false;
        this.nSubscriptions = 0;
        this.subscriptions = {};
        this.subscriptionCounter = 0;
        this.unsubscriber = null;
    }

    //Public methods
    public Subscribe(observer: Observer<T>): Subscription
    {
        const id = this.subscriptionCounter++;
        this.subscriptions[id] = observer;

        if(this.nSubscriptions++ === 0)
            this.unsubscriber = this.subscriber({ next: this.OnNextValue.bind(this) });
        else if(this.hasState)
            observer.next(this.state!);


        const context = this;
        return {
            Unsubscribe()
            {
                delete context.subscriptions[id];
                context.nSubscriptions--;
                if(context.nSubscriptions === 0)
                    context.Reset();
            }
        };
    }

    //Private members
    private state?: T;
    private hasState: boolean;
    private nSubscriptions: number;
    private subscriptions: Dictionary<Observer<T>>;
    private subscriptionCounter: number;
    private unsubscriber: Subscription | null;

    //Private methods
    private Emit()
    {
        for (const key in this.subscriptions)
        {
            if(this.subscriptions.hasOwnProperty(key))
            {
                const subscription = this.subscriptions[key];
                subscription!.next(this.state!);
            }
        }
    }

    private Reset()
    {
        this.state = undefined;
        this.hasState = false;
        this.unsubscriber!.Unsubscribe();
        this.subscriptionCounter = 0;
    }

    //Event handlers
    private OnNextValue(newValue: T)
    {
        this.hasState = true;
        this.state = newValue;
        this.Emit();
    }
}