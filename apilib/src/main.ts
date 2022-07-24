/**
 * ACTS-Util
 * Copyright (C) 2020-2022 Amir Czwink (amir130@hotmail.de)
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
import { APIRegistryInstance, APIRegistryInterface } from './APIRegistry';
import { APIController, Body, BodyProp, Delete, FormField, Get, Header, Patch, Path, Post, Put, Query, Request, Security } from './decorators';
import { BadRequest, Forbidden, InternalServerError, NotFound, Ok, Unauthorized } from './Responses';
import { WrapAPIs } from './Wrap';

export const APIRegistry: APIRegistryInterface = APIRegistryInstance;

export {
    APIController,
    BadRequest,
    Body,
    BodyProp,
    Delete,
    Forbidden,
    FormField,
    Get,
    Header,
    InternalServerError,
    NotFound,
    Ok,
    Patch,
    Path,
    Post,
    Put,
    Query,
    Request,
    Security,
    Unauthorized,
    WrapAPIs
};