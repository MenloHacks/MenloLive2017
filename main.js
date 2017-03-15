$( function() {

    var token = $.cookie("token");
    var tab_list = $("#tab-list");
    var claimed_tickets = $("#claimed-tickets");
    var weekdays = new Array(7);
    weekdays['0'] = "Sunday";
    weekdays['1'] = "Monday";
    weekdays['2'] = "Tuesday";
    weekdays['3'] = "Wednesday";
    weekdays['4'] = "Thursday";
    weekdays['5'] = "Friday";
    weekdays['6'] = "Saturday";
    var event_list = $("#eventList");
    var until_hacking_end = $("#until-hacking-end");
    var hacking_end;
    var hacking_start;
    var open_tickets = $("#open-tickets");
    var your_tickets = $("#your-tickets");
    var your_and_claimed = $("#your-tickets, #claimed-tickets");
    var pusher = new Pusher('243035ed0c201ba987a5', {
        encrypted: true
    });

    var announcements_channel = pusher.subscribe('com.vivere.announcement.update');
    var events_channel = pusher.subscribe('com.vivere.event.update');
    var ticket_updates = pusher.subscribe("com.vivere.mentor.update");







    $('#tabs').tabs();
    $.get("https://api.menlohacks.com/times", function(data) {
        hacking_end = new Date(data["data"]["hacking_end_time"]);
        hacking_start = new Date(data["data"]["hacking_start_time"]);
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
    });
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



    function isoToHumanString(isoTime) {
        var dt = new Date(isoTime);
        var hours = dt.getHours();
        var minutes = dt.getMinutes();
        var ampm = "AM";

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
        var old_weekday = "";
        for(var i in results) {
            var parsed_end = Date.parse(results[i]["end_time"]);
            if(now < parsed_end + 3600000) {
                var parsed_start = Date.parse(results[i]["start_time"]);
                var weekday = weekdays[new Date(parsed_start).getDay()];
                if (weekday != old_weekday){
                    event_list.append("<tr><td colspan='3' style='background-color:#7D5BA6; color: white' '>" + weekday + "</td></tr>");
                    old_weekday = weekday;
                }

                var ongoing;
                if(now > parsed_start && now < parsed_end) {
                    ongoing = "event-ongoing";
                }
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
    // Maps
    function addMaps(maps) {
        for(var i in maps) {
            $("#mapList").append(
                "<h3>" + maps[i]["name"] + "</h3>" +
            "<img src='"+ maps[i]["map"] + "' class='img-responsive center-block'>");
        }
        $(".event").click(function(e) {
            $("#myModalLabel").html(e.currentTarget.getAttribute("data-title"));
            $("#mainMap").attr("src", e.currentTarget.getAttribute("data-map"));
        });
    }


    $.get("https://api.menlohacks.com/mentorship/queue", function(data) {
        loadOpenTickets(data["data"]);
    });

    function loadOpenTickets(results) {
        if (results.length == 0) {
            open_tickets.append("<tr><td colspan='5' class='text-center'>There are no open tickets.</td></tr>")
        }
        else {
            for(var i in results) {
                var result = results[i];
                open_tickets.append(
                    "<tr data-id='" + result["id"] + "'>" +
                    "<td>" + result["description"] +  "</td>" +
                    "<td>" + result["contact"] + "</td>" +
                    "<td>" + result["location"] + "</td>" +
                    "<td>" + isoToHumanString(result["time_created"]) + "</td>" +
                    "<td><button class='claim-ticket btn'>Claim</button></td>" +
                    "</tr>");
            }
        }
    }

    if ($.cookie("token") && $.cookie("token") != "null") {
        firstLogin();
    }

    function loadYourTickets(results) {
        your_tickets.find("tr").remove();
        var open = results["open"];
        for(var i in open) {
            var result = open[i];
            your_tickets.append(
                "<tr data-id='" + result["id"] + "' class='open-ticket'>" +
                "<td>" + result["description"] +  "</td>" +
                "<td>" + result["contact"] + "</td>" +
                "<td>" + result["location"] + "</td>" +
                "<td>" + isoToHumanString(result["time_created"]) + "</td>" +
                "<td>Open</td>" +
                "<td><button class='btn btn-warning close-ticket'>Close</button></td>" +
                "</tr>");
        }
        var in_progress = results["in_progress"];
        for(i in in_progress) {
            result = in_progress[i];
            your_tickets.append(
                "<tr data-id='" + result["id"] + "' class='in-progress-ticket'>" +
                "<td>" + result["description"] +  "</td>" +
                "<td>" + result["contact"] + "</td>" +
                "<td>" + result["location"] + "</td>" +
                "<td>" + isoToHumanString(result["time_created"]) + "</td>" +
                "<td>In Progress</td>" +
                "<td><button class='btn btn-danger close-ticket'>Close</button></td>" +
                "</tr>");
        }
        var expired = results["expired"];
        for(i in expired) {
            result = expired[i];
            console.log();
            your_tickets.append(
                "<tr data-id='" + result["id"] + "' class='expired-ticket'>" +
                "<td>" + result["description"] +  "</td>" +
                "<td>" + result["contact"] + "</td>" +
                "<td>" + result["location"] + "</td>" +
                "<td>" + isoToHumanString(result["time_created"]) + "</td>" +
                "<td>Expired</td>" +
                "<td><button class='btn btn-warning reopen-ticket'>Reopen</button></td>" +
                "</tr>");
        }
        var closed = results["closed"];
        for(i in results["closed"]) {
            result = closed[i];
            your_tickets.append(
                "<tr data-id='" + result["id"] + "' class='closed-ticket'>" +
                "<td>" + result["description"] +  "</td>" +
                "<td>" + result["contact"] + "</td>" +
                "<td>" + result["location"] + "</td>" +
                "<td>" + isoToHumanString(result["time_created"]) + "</td>" +
                "<td>Closed</td>" +
                "<td><button class='btn btn-warning reopen-ticket'>Reopen</button></td>" +
                "</tr>");
        }
        if (open.length == 0 && in_progress.length == 0 && expired.length == 0 && closed.length==0) {
            your_tickets.append("<tr><td colspan='6' class='text-center'>You don't have any tickets</td>")
        }
    }



    function loadClaimedTickets(results) {
        claimed_tickets.find("tr").remove();
        for(var i in results) {
            var result = results[i];
            claimed_tickets.append(
                "<tr data-id='" + result["id"] + "'>" +
                "<td>" + result["description"] +  "</td>" +
                "<td>" + result["contact"] + "</td>" +
                "<td>" + result["location"] + "</td>" +
                "<td>" + isoToHumanString(result["time_created"]) + "</td>" +
                "<td><button class='btn btn-warning close-ticket'>Close</button><button class='btn btn-warning reopen-ticket' style='margin-left: 10px;'>Reopen</button></td>" +
                "</tr>");
        }
        if (results.length == 0) {
            claimed_tickets.append("<tr><td colspan='6' class='text-center'>You have not claimed any tickets.</td>")
        }
    }

    $("#new-ticket").click(function () {
       authorizeUser(function() {
           swal({
               title: 'Create a Ticket',
               html:
               'Description:<input id="description" class="swal2-input" placeholder="Describe your issue">' +
               'Location:<input id="location" class="swal2-input" placeholder="Where are you?">' +
               'Contact:<input id="contact" class="swal2-input" placeholder="email, phone number, etc.">',
               preConfirm: function () {
                   return new Promise(function (resolve) {
                       resolve([
                           $('#description').val(),
                           $('#location').val(),
                           $('#contact').val()
                       ])
                   });
               },
               onOpen: function () {
                   $('#description').focus();
               }
           }).then (function (data) {
               $.ajax({
                   url: "https://api.menlohacks.com/mentorship/create",
                   headers: {
                       "X-MenloHacks-Authorization": $.cookie("token")
                   },
                   contentType: 'application/json; charset=utf-8',
                   data: JSON.stringify({
                       description: data[0],
                       location: data[1],
                       contact: data[2]
                   }),
                   type: "POST",
                   success: function() {
                       swal({
                           title: "Successfully created ticket!",
                           type: "success",
                           timer: 2000
                       });
                   },
                   error:  function (data) {
                       handleErrors(data, function () {
                           
                       })
                   }
               })
           });
       });
    });

    $(".login").click(function () {
       authorizeUser(function () {})
    });

    function addUser() {
        swal({
            title: 'Create Mentor Account',
            html:
            'Full Name:<input id="name" class="swal2-input">' +
            'Email:<input id="email" class="swal2-input">' +
            'Password:<input  type="password" id="password" class="swal2-input">',
            preConfirm: function () {
                return new Promise(function (resolve) {
                    resolve([
                        $('#name').val(),
                        $('#email').val(),
                        $('#password').val()
                    ])
                });
            },
            onOpen: function () {
                $('#name').focus()
            },
            showCancelButton: true,
            confirmButtonText: "Create Account"
        }).then(function (result) {
            $.ajax({
                url: "https://api.menlohacks.com/user/create",
                data: JSON.stringify({
                    "name" : result[0],
                    "username": result[1],
                    "password": result[2]
                }),
                contentType: 'application/json; charset=utf-8',
                error: function (data) {
                    handleErrors(data, function () {
                        addUser();
                    });
                },
                success: function(data) {
                    swal({
                        title: "Created Account",
                        type: "success",
                        timer: 2000
                    });
                },
                type: "POST"
            });
        }).catch(swal.noop);
    }




    function updateTickets() {

        //Open tickets
        $.get("https://api.menlohacks.com/mentorship/queue", function(data) {
            open_tickets.find("tr").remove();
            loadOpenTickets(data["data"]);
        });
        if ($.cookie("token") && $.cookie("token") != "null") {
            $.ajax({
                url: "https://api.menlohacks.com/mentorship/user/queue",
                contentType: 'application/json; charset=utf-8',
                headers: {
                    "X-MenloHacks-Authorization": $.cookie("token")
                },
                type: "GET",
                success: function(data) {
                    your_tickets.find("tr").remove();
                    loadYourTickets(data["data"]["tickets"]);
                }
            });
            $.ajax({
                url: "https://api.menlohacks.com/mentorship/user/claimed",
                contentType: 'application/json; charset=utf-8',
                headers: {
                    "X-MenloHacks-Authorization": $.cookie("token")
                },
                type: "GET",
                success: function(data) {
                    claimed_tickets.find("tr").remove();
                    loadClaimedTickets(data["data"]);
                }
            });
        }
    }

    function authorizeUser(callback) {
        if ($.cookie("token") && $.cookie("token") != "null"){
            callback();
        } else {
            swal({
                title: 'Log in',
                html:
                'Email:<input id="email" class="swal2-input">' +
                'Password:<input  type="password" id="password" class="swal2-input">',
                preConfirm: function () {
                    return new Promise(function (resolve) {
                        resolve([
                            $('#email').val(),
                            $('#password').val()
                        ])
                    });
                },
                onOpen: function () {
                    $('#email').focus()
                },
                showCancelButton: true,
                confirmButtonText: "Log in"
            }).then(function (result) {
                $.ajax({
                    url: "https://api.menlohacks.com/user/login",
                    data: JSON.stringify({
                        "username": result[0],
                        "password": result[1]
                    }),
                    contentType: 'application/json; charset=utf-8',
                    error: function (data) {
                        handleErrors(data, function () {
                            authorizeUser();
                        });
                    },
                    success: function(data) {
                        $.cookie("token", data["data"]["token"]);
                        swal({
                            title: "Logged in.",
                            type: "success",
                            timer: 2000
                        }).then(function() {
                            callback();
                        }, function() {
                            callback();
                        });
                        firstLogin();
                    },
                    type: "POST"
                });
            }).catch(swal.noop);
        }
    }

    function handleErrors(data, callback) {
        var error = JSON.parse(data["responseText"])["error"];
        swal(error["title"], error["message"], "error").then(function () {
            callback();
        });
    }



    open_tickets.on("click", ".claim-ticket", function() {
        var element = $(this);
        authorizeUser(function () {
            var id = element.parent().parent().attr("data-id");
            $.ajax({
                url: "https://api.menlohacks.com/mentorship/claim",
                contentType: 'application/json; charset=utf-8',
                headers: {
                    "X-MenloHacks-Authorization": $.cookie("token")
                },
                data : JSON.stringify({
                    id: id
                }),
                type: "POST",
                error: function(data) {
                    handleErrors(data, function () {})
                },
                success: function() {
                    swal("Successfully claimed ticket", "Best of luck solving the issue", "success");
                }
            });
        });
    });
    your_and_claimed.on("click", ".close-ticket", function () {
        var id = $(this).parent().parent().attr("data-id");
        $.ajax({
            url: "https://api.menlohacks.com/mentorship/close",
            contentType: 'application/json; charset=utf-8',
            headers: {
                "X-MenloHacks-Authorization": $.cookie("token")
            },
            data : JSON.stringify({
                id: id
            }),
            type: "POST",
            error: function(data) {
                handleErrors(data, function () {})
            },
            success: function() {
                swal("Successfully closed ticket", "You can reopen the ticket if you created it in your tickets section.", "success");
            }
        });

    });
    your_and_claimed.on("click", ".reopen-ticket", function () {
        var element = $(this);
        authorizeUser(function () {
            var id = element.parent().parent().attr("data-id");
            console.log("id" +  id);
            $.ajax({
                url: "https://api.menlohacks.com/mentorship/reopen",
                contentType: 'application/json; charset=utf-8',
                headers: {
                    "X-MenloHacks-Authorization": $.cookie("token")
                },
                data : JSON.stringify({
                    id: id
                }),
                type: "POST",
                error: function(data) {
                    handleErrors(data, function () {});
                },
                success: function() {
                    swal("Successfully reopened ticket", "It can now be claimed by a mentor", "success");
                }
            });
        });
    });

    tab_list.on("click", "#logout", function() {
        $.cookie("token", null);
        swal({
            title: "Logged out",
            text: "See you later!",
            type: "success",
            timer: 2000
        }).then(function() {
            location.reload();
        }, function () {
            location.reload();
        });
    });


    function firstLogin() {
        $.ajax({
            url: "https://api.menlohacks.com/mentorship/user/queue",
            contentType: 'application/json; charset=utf-8',
            headers: {
                "X-MenloHacks-Authorization": $.cookie("token")
            },
            type: "GET",
            success: function(data) {
                your_tickets.find("tr").remove();
                loadYourTickets(data["data"]["tickets"]);
            }
        });
        $.ajax({
            url: "https://api.menlohacks.com/mentorship/user/claimed",
            contentType: 'application/json; charset=utf-8',
            headers: {
                "X-MenloHacks-Authorization": $.cookie("token")
            },
            type: "GET",
            success: function(data) {
                claimed_tickets.find("tr").remove();
                loadClaimedTickets(data["data"]);

            }
        });
        tab_list.append("<li id='logout-li'><button id='logout' class='btn'>Logout</button></li>");
    }

    Pusher.logToConsole = true;


    announcements_channel.bind('save', function(data) {
        $("#announcementList").prepend(
            "<tr><td>" + data["message"] + "</td>" +
            "<td>" + isoToHumanString(data["time"]) + "</td></tr>"
        );
    });

    events_channel.bind('save', function(data) {
        $.get("https://api.menlohacks.com/events", function(data) {
            event_list.find("tr").remove();
            loadResults(data["data"]);
        });
    });
    ticket_updates.bind("save", function (data) {
        updateTickets();
    });

    ticket_updates.bind("expire", function (data) {
        updateTickets();
    });


});