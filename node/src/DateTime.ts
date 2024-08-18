/**
 * ACTS-Util
 * Copyright (C) 2024 Amir Czwink (amir130@hotmail.de)
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
import moment from "moment-timezone";

function MapTimeZone(timeZone: string)
{
    switch(timeZone)
    {
        case "CEST": //moment does automatically recognize daylight saving time but has no entry for Central European Summer Time 
            return "CET";
    }
    return timeZone;
}

function ZeroPad(value: number)
{
    if(value < 10)
        return "0" + value;
    return value.toString();
}

function FormInputString(year: number, month: number, day: number, hours: number, minutes: number, seconds: number)
{
    const date = [year, ZeroPad(month), ZeroPad(day)];
    const time = [hours, minutes, seconds];

    const momentInput = date.join("-") + "T" + time.map(x => ZeroPad(x)).join(":");
    return momentInput;
}

function ValidateNaturalNumber(n: number, max: number)
{
    if(!Number.isInteger(n))
        throw new Error("Date time values must be natural numbers. Got: " + n);
}

export class DateTime
{
    //Constructor
    private constructor(private moment: moment.Moment)
    {
    }

    //Properties
    public get dayOfMonth()
    {
        return this.moment.date();
    }

    public get hours()
    {
        return this.moment.hour();
    }

    public get month()
    {
        return this.moment.month() + 1;
    }

    public get millisecondsSinceEpoch()
    {
        return this.moment.valueOf();
    }

    public get year()
    {
        return this.moment.year();
    }

    public get zone()
    {
        return {
            name: this.moment.zoneName(),
            abbreviation: this.moment.zoneAbbr(),
            offsetToUTC: this.moment.utcOffset()
        };
    }

    //Public methods
    public AddMinutes(count: number)
    {
        const clone = this.moment.clone();
        return new DateTime(clone.add(count, "minutes"));
    }

    public AddHours(count: number)
    {
        const clone = this.moment.clone();
        return new DateTime(clone.add(count, "hours"));
    }

    public AddWeeks(count: number)
    {
        const clone = this.moment.clone();
        return new DateTime(clone.add(count, "weeks"));
    }

    public EndOfMonth()
    {
        const clone = this.moment.clone();
        return new DateTime(clone.endOf("month"));
    }

    public Format(format: string)
    {
        return this.moment.format(format);
    }

    public IsAfter(other: DateTime)
    {
        return this.moment.isAfter(other.moment);
    }

    public IsBefore(other: DateTime)
    {
        return this.moment.isBefore(other.moment);
    }
    
    public ToISOString()
    {
        return this.moment.toISOString();
    }

    public ToUTC()
    {
        if(this.moment.isUTC())
            return this;

        const clone = this.moment.clone();
        return new DateTime(clone.utc());
    }

    //Class functions
    public static Construct(year: number, month: number, day: number, hours: number, minutes: number, seconds: number, timeZone: string)
    {
        const momentInput = FormInputString(year, month, day, hours, minutes, seconds);
        const converted = moment.tz(momentInput, MapTimeZone(timeZone));

        return new DateTime(converted);
    }

    public static ConstructFromISOString(isoString: string)
    {
        return new DateTime(moment(isoString));
    }

    public static ConstructFromUnixTimeStamp(unixTimeStamp: number)
    {
        return new DateTime(moment.unix(unixTimeStamp));
    }

    public static ConstructUTC(year: number, month: number, day: number, hours: number, minutes: number, seconds: number)
    {
        ValidateNaturalNumber(hours, 23);
        ValidateNaturalNumber(minutes, 59);
        ValidateNaturalNumber(seconds, 59);

        const momentInput = FormInputString(year, month, day, hours, minutes, seconds);
        const mom = moment.utc(momentInput + "Z");
		return new DateTime(mom);
	}

    public static Now()
    {
        return new DateTime(moment());
    }
}