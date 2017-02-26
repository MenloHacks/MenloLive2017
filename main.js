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
            until_hacking_end.text("Hacking Hasn't Started");
            $(".countdown-info").text("");
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

    function loadResults(results) {
        var now = Date.now();
        for(var i in results) {
            if(now < Date.parse(results[i]["end_time"]) + 3600000) {
                var ongoing;
                if(now > Date.parse(results[i]["start_time"]) && now < Date.parse(results[i]["end_time"]))
                    ongoing = "event-ongoing";
                else
                    ongoing = "";
                $("#eventList").append(
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

            $("#eventList").append(
                "<tr class=\" event \" data-toggle=\"modal\" data-target=\"#myModal\" data-map=\"" +
                maps[i]["map"] + "\" data-title=\"" + maps[i]["name"] + "\">" +
                "<td>" +
                maps[i]["name"] + "</td>" +
                "</tr>");
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