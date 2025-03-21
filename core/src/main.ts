/**
 * ACTS-Util
 * Copyright (C) 2020-2025 Amir Czwink (amir130@hotmail.de)
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
import "./ArrayExtensions";
import "./FunctionExtensions";
import "./MapExtensions";
import "./NumberExtensions";
import "./RegExpExtensions";
import "./SetExtensions";
import "./StringExtensions";

import "./Enumeration/async/AsyncFilterEnumerator";
import "./Enumeration/async/AsyncMapEnumerator";

import "./Enumeration/BoolEnumeratorExtensions";
import "./Enumeration/FilterIterator";
import "./Enumeration/FlatteningIterator";
import "./Enumeration/MapIterator";
import "./Enumeration/NumberEnumeratorExtensions";
import "./Enumeration/PromiseEnumeratorExtensions";
import "./Enumeration/StringEnumeratorExtensions";

import { Dictionary, NumberDictionary } from "./Dictionary";
import { MulticastObservable } from "./Observables/MulticastObservable";
import { Observable, Observer, Subscription, SubscriberFunction } from "./Observables/Observable";
import { Property, PropertyObserver } from "./Observables/Property";
import { Injector, Instantiatable, ResolutionStrategy } from "./Injector";
import { Duration } from "./Duration";
import { Subject } from "./Observables/Subject";
import { EqualsAny } from "./EqualsAny";
import { TimeUtil } from "./TimeUtil";
import { ObjectExtensions, ObservableObject } from "./ObjectExtensions";
import { CachedProperty } from "./CachedProperty";
import { AbsURL } from "./AbsURL";
import { URLParser } from "./URLParser";
import * as OpenAPI from "./OpenAPI/Specification";
import { OpenAPIDefaultObjectCreator } from "./OpenAPI/OpenAPIDefaultObjectCreator";
import { OpenAPISchemaValidator } from "./OpenAPI/OpenAPISchemaValidator";
import { KeyValuePair } from "./KeyValuePair";
import { EnumeratorBuilder } from "./Enumeration/EnumeratorBuilder";
import { Enumerable } from "./Enumeration/Enumerable";
import { OIDC_Config } from "./OIDC";

function Of<T>(value: T)
{
    return value;
}

//Exports
export {
    AbsURL,
    CachedProperty,
    Dictionary,
    Duration,
    Enumerable,
    EnumeratorBuilder,
    EqualsAny,
    Injector,
    Instantiatable,
    KeyValuePair,
    MulticastObservable,
    NumberDictionary,
    Observable,
    ObservableObject,
    Observer,
    Of,
    OIDC_Config,
    OpenAPI,
    OpenAPIDefaultObjectCreator,
    OpenAPISchemaValidator,
    Property,
    PropertyObserver,
    ResolutionStrategy,
    ObjectExtensions,
    Subject,
    SubscriberFunction,
    Subscription,
    TimeUtil,
    URLParser,
};