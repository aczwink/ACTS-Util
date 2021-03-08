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

export const TimeUtil = new class
{
    //Public methods
    public Delay(ms: number)
    {
        return new Promise( resolve => {
            setTimeout(resolve, ms);
        });
    }

    public TimeToString(time: number, includeHours = false): string
    {
        if(time < 0)
            return "-" + this.TimeToString(-time);
            
        var hours: any   = Math.floor(time / 3600);
        var minutes: any = Math.floor((time - (hours * 3600)) / 60);
        var seconds: any = time - (hours * 3600) - (minutes * 60);
        
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}
	
        if(hours || includeHours)
        {
            if (hours   < 10) {hours   = "0"+hours;}
            return hours+':'+minutes+':'+seconds;
        }
        return minutes+':'+seconds;
    }
};