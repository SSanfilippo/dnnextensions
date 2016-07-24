﻿/*
 * Copyright (c) 2016, Will Strohl
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list 
 * of conditions and the following disclaimer.
 * 
 * Redistributions in binary form must reproduce the above copyright notice, this 
 * list of conditions and the following disclaimer in the documentation and/or 
 * other materials provided with the distribution.
 * 
 * Neither the name of Will Strohl, nor the names of its contributors may be used 
 * to endorse or promote products derived from this software without specific prior 
 * written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
 * IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, 
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, 
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, 
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF 
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE 
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF 
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

using System;
using System.Collections.Generic;
using System.Web.Caching;
using DotNetNuke.Common.Utilities;
using DotNetNuke.ComponentModel.DataAnnotations;
using Newtonsoft.Json;
using WillStrohl.Modules.CodeCamp.Components;

namespace WillStrohl.Modules.CodeCamp.Entities
{
    [TableName("wns_CodeCamp_TimeSlot")]
    [PrimaryKey("TimeSlotId", AutoIncrement = true)]
    [Cacheable("TimeSlot", CacheItemPriority.Default, 20)]
    [Scope("CodeCampId")]
    public class TimeSlotInfo : ITimeSlotInfo
    {
        public int TimeSlotId { get; set; }

        public int CodeCampId { get; set; }

        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime BeginTime { get; set; }

        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime EndTime { get; set; }

        public string AgendaText { get; set; }

        public bool SpanAllTracks { get; set; }

        public bool IncludeInDropDowns { get; set; }

        public int CreatedByUserId { get; set; }

        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime CreatedByDate { get; set; }

        public int LastUpdatedByUserId { get; set; }

        [JsonConverter(typeof(DateTimeConverter))]
        public DateTime LastUpdatedByDate { get; set; }

        [IgnoreColumn]
        public List<CustomPropertyInfo> CustomPropertiesObj
        {
            get { return JsonHelper.ObjectFromJson<List<CustomPropertyInfo>>(CustomProperties); }
            set { CustomProperties = value.ToJson(); }
        }

        public string CustomProperties { get; set; }

        [IgnoreColumn]
        public int SortOrder { get; set; }
    }
}