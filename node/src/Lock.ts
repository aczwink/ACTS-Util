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
import { EventEmitter } from "events";

export class Lock
{
    constructor()
    {
        this.locked = false;
        this.eventEmitter = new EventEmitter;
    }

    //Public methods
    public async Lock()
    {
        while(true)
        {
            const result = this.TryLock();
            if(result !== null)
                return result;

            await new Promise<void>( resolve => {
                const removeThenResolve = () => {
                    this.eventEmitter.removeListener("release", removeThenResolve);
                    return resolve();
                };
                this.eventEmitter.on("release", removeThenResolve);
            });
        }
    }

    public TryLock()
    {
        if(!this.locked)
        {
            this.locked = true;
            return {
                Release: this.Release.bind(this)
            };
        }

        return null;
    }

    //Private members
    private locked: boolean;
    private eventEmitter: EventEmitter;

    //Private methods
    private Release()
    {
        this.locked = false;
        setImmediate( () => this.eventEmitter.emit("release") );
    }
}