// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery-ui
//= require handlebars.min
//= require jquery_ujs
//= require spin.min
//= require bootstrap-sprockets
//= require_tree .


var api_data;

var shows = {};
var venues = [];
var performances = [];


var MARATHON_START_TIME = 1435348800;
var MARATHON_END_TIME = 1435549920; //hack, not computed

var WIDTH_PER_MINUTE = 8.0;

function convertDurationToWidth(durationInMinutes){
    return (durationInMinutes - 1) * WIDTH_PER_MINUTE;
};

function convertStartTimeToOffset(timestamp){
    return (timestamp - MARATHON_START_TIME) / 60.0 * WIDTH_PER_MINUTE;
}

function convertTimeStampToDate(timestamp, include_am_pm) {
    if(include_am_pm) {
        return moment(timestamp * 1000).format("h:mm a");
    } else {
        return moment(timestamp * 1000).format("h:mm");
    }

}

function convertTimeStampToHourMarker(timestamp) {
    return moment(timestamp * 1000).format("ddd  h:mm A");
}

function navigateToShow(showId){
    console.log("navigating to " + showId);

    for(var i = 0; i < performances.length; i++){
        if(performances[i].show_id == showId){
            var perf = performances[i];
            var leftOffset = convertStartTimeToOffset(perf.starttime);
            var topOffset = $("#venue_row_" + perf.venue_id).offset().top;

            //Account for the header
            if(perf.venue_id != 94){
                topOffset = topOffset - 50;
            } else {
                topOffset = topOffset - 75;
            }

            $('html, body').animate({
                scrollLeft: leftOffset
            }, 300, function() {
                $('html, body').animate({
                    scrollTop: topOffset
                }, 300, function() {
                        $('[data-performance-id="'+ perf.id + '"]').click();

                        $('[data-performance-id="'+ perf.id + '"]').addClass("search-result-on");

                    }
                );
            });
        }
    }
}


$.ready(new function(){
    $(function() {
        var target = $("#master-spin");
        var spinner = new Spinner({color: '#fff'}).spin(target[0]);

        $.ajax({
            url: "/data",
            success: function(data) {
                console.log('data loaded');
                api_data = data.data;

                spinner.stop();

                $("#master-spin").stop();

                venues = api_data.Venues;

                for(var i = 0; i < api_data.Shows.length; i++){
                    var show = api_data.Shows[i];
                    api_data.Shows[i]["label"] = api_data.Shows[i].show_name;
                    api_data.Shows[i]["value"]= api_data.Shows[i].id;
                    shows["" + show.id] = show;
                }

                console.log("shows hash created");

                //Make the schedule oh so wide
                $("#schedule").css("width", convertDurationToWidth((MARATHON_END_TIME-MARATHON_START_TIME)/60) + "px");

                // Get some templates ready
                var venueRowTemplate = Handlebars.compile($("#venue-row-template").html());
                var locationTemplate = Handlebars.compile($("#location-template").html());
                var showTemplate = Handlebars.compile($("#show-template").html());
                var hourTemplate = Handlebars.compile($("#hour-template").html());

                var schedule = $("#schedule")
                var locationPanel = $(".location-panel");

                //put up the hour markers
                var hour_container = $("#time-bar");
                for(var i = MARATHON_START_TIME; i <MARATHON_END_TIME; i+=60*60){
                    var vals = {hour: convertTimeStampToHourMarker(i),
                        width: convertDurationToWidth(60),
                        offset: convertStartTimeToOffset(i) + 75
                    }
                    hour_container.append(hourTemplate(vals));
                }

                // We have the put the venues-labels in reverse
                for(var i = venues.length-1; i >= 0 ; i--){
                    locationPanel.append(locationTemplate(venues[i]));
                }

                for(var i = 0; i < venues.length ; i++){
                    schedule.append(venueRowTemplate(venues[i]));
                }

                performances = api_data.Schedules;

                for(var i = 0; i < performances.length; i++){

                    var perf = performances[i];
                    var show = shows[perf.show_id];

                    var width = convertDurationToWidth(perf.minutes);
                    var offset = convertStartTimeToOffset(perf.starttime);

                    var vars = {"show": show,
                        perf: perf,
                        width: width,
                        offset: offset,
                        starttime: perf.starttime,
                        start: convertTimeStampToDate(perf.starttime),
                        endtime: perf.endtime,
                        end: convertTimeStampToDate(perf.endtime, true)
                    };
                    //if(perf.venue_id == 94) {
                        var container = $("#venue_row_" + perf.venue_id);
                        container.append(showTemplate(vars));
                    //}
                }

                //click => show details
                $(".show").click(function(){
                    //clear any other highlight;
                    $('.search-result-on').removeClass("search-result-on");

                    var show_id = $(this).attr("data-show-id");

                    var show = shows[show_id];
                    var starttime = $(this).attr("data-start-time");
                    var endtime = $(this).attr("data-end-time");

                    $(".modal-show-title").html(show.show_name);
                    $(".modal-show-description").html(show.promo_blurb);
                    $(".modal-show-times").html(convertTimeStampToDate(starttime) + " - " + convertTimeStampToDate(endtime,true));
                    $(".modal-image").removeAttr("src");
                    if(show.image){
                        $(".modal-image").attr("src", show.image);
                        $(".modal-image").show();
                    } else {
                        $(".modal-image").hide();
                    }

                    $("#show-modal").modal({
                        keyboard: true
                    });
                });

                $("#search-box").autocomplete({
                    source: api_data.Shows,
                    select: function(event, ui){
                        $("#search-box").val("");
                        navigateToShow(ui.item.value);
                        return false;
                    }
                });
            }
        });

        //This keeps the fixed panel lined up.
        var foo = $("#location-panel");
        $(window).scroll(function(){
            foo.css("top", -1 * window.scrollY);
        });
    });
})