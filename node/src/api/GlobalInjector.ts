/**
 * ACTS-Util
 * Copyright (C) 2019-2021 Amir Czwink (amir130@hotmail.de)
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
import { Injector } from "acts-util-core";

export const GlobalInjector = new Injector;
GlobalInjector.RegisterInstance(Injector, GlobalInjector);

export function Injectable<T extends {new(...args:any[]):{}}>(constructor:T)
{
    GlobalInjector.RegisterProvider(constructor, constructor);
    return constructor;
}