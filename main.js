$( function() {

    var until_hacking_end = $("#until-hacking-end");
    var hacking_end;
    var hacking_start;
    $.get("https://api.menlohacks.com/times", function(data) {
        hacking_end = new Date(data["data"]["hacking_end_time"]);
        hacking_start = new Date(data["data"]["hacking_start_time"]);
    });
    setInterval(function() {
        var now = new Date(Date.now());
        if (now < hacking_start){
            until_hacking_end.text(formatDate(hacking_start - new Date(Date.now())));
            $(".countdown-info").text("Until hacking begins");
        } else if (now < hacking_end && now > hacking_start) {
            until_hacking_end.text(formatDate(hacking_end - new Date(Date.now())));
        } else {
            until_hacking_end.text("Hacking Is Now Over");
        }
    }, 1000);
    function formatDate(date) {
        var hour = Math.floor(date/1000/60/60);
        var minute = Math.floor(date%(hour*1000*60*60)/1000/60);
        var second = Math.floor(date%(hour*1000*60*60 + minute*1000*60)/1000);
        if (minute < 10){
            minute = "0" + minute.toString();
        }
        if (second < 10){
            second = "0" + second.toString();
        }
        return hour + ":" + minute + ":" + second;
    }

    $.get("https://api.menlohacks.com/announcements", function(data) {
        loadAnnouncements(data["data"]);
    });

    function loadAnnouncements(results) {
        for(var i in results) {
            $("#announcementList").append(
                "<tr><td>" + results[i]["message"] + "</td>" +
                "<td>" + isoToHumanString(results[i]["time"]) + "</td></tr>"
            );
        }
    }

    Pusher.logToConsole = true;

    var pusher = new Pusher('243035ed0c201ba987a5', {
        encrypted: true
    });

    var announcements_channel = pusher.subscribe('com.vivere.announcement.update');
    announcements_channel.bind('save', function(data) {
        $.get("https://api.menlohacks.com/announcements", function(data) {
            console.log("test");
            $("#announcementList").find("tr:gt(0)").remove();
            loadAnnouncements(data["data"]);
        });
    });

    var events_channel = pusher.subscribe('com.vivere.event.update');
    events_channel.bind('save', function(data) {
        $.get("https://api.menlohacks.com/events", function(data) {
            $("#eventList").find("tr:gt(0)").remove();
            loadResults(data["data"]);
        });
    });

    function isoToHumanString(isoTime) {
        var dt = new Date(isoTime);
        var hours = dt.getHours();
        var minutes = dt.getMinutes();
        var ampm = "AM";
        console.log(hours + " " + minutes);

        if (hours >= 12) {
            ampm = "PM";
        }
        hours = hours % 12;

        if (hours == 0)
            hours = 12;

        if (minutes < 10)
            minutes = '0' + minutes;

        return "" + hours + ":" + minutes + " " + ampm
    }

    $.get("https://api.menlohacks.com/events", function(data) {
        loadResults(data["data"]);
    });
    var weekdays = new Array(7);
    weekdays['0'] = "Sunday";
    weekdays['1'] = "Monday";
    weekdays['2'] = "Tuesday";
    weekdays['3'] = "Wednesday";
    weekdays['4'] = "Thursday";
    weekdays['5'] = "Friday";
    weekdays['6'] = "Saturday";
    var event_list = $("#eventList");
    function loadResults(results) {
        var now = Date.now();
        var old_weekday = "";
        for(var i in results) {
            var parsed_end = Date.parse(results[i]["end_time"]);
            if(now < parsed_end + 3600000) {
                console.log(i);
                var parsed_start = Date.parse(results[i]["start_time"]);
                var weekday = weekdays[new Date(parsed_start).getDay()];
                if (weekday != old_weekday){
                    event_list.append("<tr><td colspan='3' style='background-color:#7D5BA6; color: white' '>" + weekday + "</td></tr>");
                    old_weekday = weekday;
                }

                var ongoing;
                if(now > parsed_start && now < parsed_end)
                    ongoing = "event-ongoing";
                else
                    ongoing = "";
                event_list.append(
                    "<tr class=\" event " + ongoing + "\" data-toggle=\"modal\" data-target=\"#myModal\" data-desc=\""
                    + results[i]["long_description"] + "\" data-map=\"" + results[i]["location"]["map"] + "\" data-title=\""
                    + results[i]["short_description"] + "\">" +
                    "<td>" +
                    results[i]["short_description"] + "</td>" +
                    "<td>" + results[i]["location"]["name"] + "</td>" +
                    "<td>" + isoToHumanString(results[i]["start_time"]) + "</td></tr>");
            }
        }
        addEventListeners();
    }
//


    function addEventListeners() {
        $(".event").click(function(e) {
            $("#myModalLabel").html(e.currentTarget.getAttribute("data-title"));
            $("#mainDescription").html(e.currentTarget.getAttribute("data-desc"));
            $("#mainMap").attr("src", e.currentTarget.getAttribute("data-map"));
        });
    }

    $.get("https://api.menlohacks.com/maps", function(data) {
        addMaps(data["data"]);
    });
    //comment
    function addMaps(maps) {
        for(var i in maps) {
            $("#mapList").append(
                "<button class=\" event button \" data-toggle=\"modal\" data-target=\"#myModal\" data-map=\"" +
                maps[i]["map"] + "\" data-title=\"" + maps[i]["name"] + "\">" +
                maps[i]["name"] +
                "</button>");
        }
        $(".event").click(function(e) {
            $("#myModalLabel").html(e.currentTarget.getAttribute("data-title"));
            $("#mainMap").attr("src", e.currentTarget.getAttribute("data-map"));
        });
    }

});



// setTimeout(function () {
//     location.reload();
// }, 30000);
//
//
//
//
//
//
//
//
//
//
//
//
//
//











/*
John's old code, in case you ever need it.
 */
