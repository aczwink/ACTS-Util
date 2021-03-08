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
import "reflect-metadata";

export interface Instantiatable<T> extends Function
{
    new(...args: any[]): T;
}

type InjectionProvider<T> = Instantiatable<T>;
type InjectionToken<T> = Instantiatable<T>;

export enum ResolutionStrategy
{
    /*Check parents and skip self */
    ParentUpwards,
    /*Check self and then parents*/
    Upwards,
}

export class Injector
{
    constructor()
    {
        this.parent = null;
        this.instances = new Map;
        this.providers = new Map;
    }

    //Public members
    public parent: Injector | null | (() => Injector | null);

    //Public methods
    public CreateInstance<T>(provider: InjectionProvider<T>): T
    {
        return new provider(...this.ResolveInjections(provider));
    }
    
    public RegisterInstance<T>(token: InjectionToken<T>, instance: T)
    {
        this.instances.set(token, instance);
    }

    public RegisterProvider<T>(token: InjectionToken<T>, provider: InjectionProvider<T>)
    {
        this.providers.set(token, provider);
    }

    public Resolve<T>(token: InjectionToken<T>, resolutionStrategy: ResolutionStrategy = ResolutionStrategy.Upwards): T
    {
        const result = this.TryResolve(token, resolutionStrategy);
        if(result === undefined)
            throw new Error("Unknown injectable: " + token);

        return result;
    }

    public TryResolve<T>(token: InjectionToken<T>, resolutionStrategy: ResolutionStrategy = ResolutionStrategy.Upwards): T | undefined
    {
        let resolved;
        if(resolutionStrategy == ResolutionStrategy.ParentUpwards)
            resolved = this.TryResolveParent(token);
        else
            resolved = this.TryResolveSelf(token);
        return resolved;
    }

    public ResolveInjections<T>(target: Instantiatable<T>): any
    {
        const argsTypes = Reflect.getMetadata('design:paramtypes', target) || [];
        const injections = argsTypes.map((argType : any) => this.Resolve(argType));
        return injections;
    }

    //Private members
    private instances: Map<InjectionToken<any>, any>;
    private providers: Map<InjectionToken<any>, InjectionProvider<any>>;

    //Private methods
    private TryResolveSelf<T>(token: InjectionToken<T>): T | undefined
    {
        let instance = this.instances.get(token);
        if(instance === undefined)
        {
            const provider = this.providers.get(token);
            if(provider === undefined)
                return this.TryResolveParent(token);

            instance = this.CreateInstance(provider);
            this.instances.set(token, instance);
        }
        return instance as unknown as T;
    }

    private TryResolveParent<T>(token: InjectionToken<T>): T | undefined
    {
        let parent = this.parent;
        if(typeof parent === "function")
            parent = parent();

        if(parent === null)
            return undefined;
        return parent.TryResolveSelf(token);
    }
}