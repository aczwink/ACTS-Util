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
import { Subject } from "./Subject";

export class MulticastObservable<T> extends Subject<T>
{
    constructor(private singleSubscriber: SubscriberFunction<T>)
    {
        super();

        this.hasState = false;
        this.unsubscriber = null;
    }

    //Private members
    private state?: T;
    private hasState: boolean;
    private unsubscriber: Subscription | null;

    //Private methods
    private Reset()
    {
        this.state = undefined;
        this.hasState = false;
        this.unsubscriber!.Unsubscribe();
    }

    //Event handlers
    protected OnNewObserver(newObserver: Observer<T>): Subscription
    {
        const subscription = super.OnNewObserver(newObserver);

        if(this.nSubscriptions === 1)
            this.unsubscriber = this.singleSubscriber({ next: this.OnNextValue.bind(this) });
        else if(this.hasState)
            newObserver.next(this.state!);


        const context = this;
        return {
            Unsubscribe()
            {
                subscription.Unsubscribe();
                if(context.nSubscriptions === 0)
                    context.Reset();
            }
        };
    }

    private OnNextValue(newValue: T)
    {
        this.hasState = true;
        this.state = newValue;
        this.Next(this.state!);
    }
}