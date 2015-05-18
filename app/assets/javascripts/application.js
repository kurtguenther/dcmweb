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
//= require_tree .


var api_data;

var shows = {};
var venues = [];
var performances = [];


var MARATHON_START_TIME = 1435348800;
var MARATHON_END_TIME = 1435622340;

var WIDTH_PER_MINUTE = 8.0;

function convertDurationToWidth(durationInMinutes){
    return (durationInMinutes - 1) * WIDTH_PER_MINUTE;
};

function convertStartTimeToOffset(timestamp){
    return (timestamp - MARATHON_START_TIME) / 60.0 * WIDTH_PER_MINUTE;
}

function convertTimeStampToDate(timestamp){
    return moment(timestamp*1000).format("h:mm");
}

$.ready(new function(){
    $(function() {
        $.ajax({
            url: "/data",
            success: function(data) {
                console.log('data loaded');
                api_data = data.data;

                venues = api_data.Venues;

                for(var i = 0; i < api_data.Shows.length; i++){
                    var show = api_data.Shows[i];
                    shows["" + show.id] = show;
                }

                console.log("shows hash created");

                //Make the schedule oh so wide
                $("#schedule").css("width", convertStartTimeToOffset(MARATHON_END_TIME) + "px");

                var venueRowTemplate = Handlebars.compile($("#venue-row-template").html());
                var locationTemplate = Handlebars.compile($("#location-template").html());
                var showTemplate = Handlebars.compile($("#show-template").html());

                var schedule = $("#schedule")
                var locationPanel = $(".location-panel");

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
                        start: convertTimeStampToDate(perf.starttime),
                        end: convertTimeStampToDate(perf.endtime)
                    };
                    //if(perf.venue_id == 94) {
                        var container = $("#venue_row_" + perf.venue_id);
                        container.append(showTemplate(vars));
                    //}
                }
            }
        });

        ////Set the schedule draggable
        //$(".schedule").draggable({
        //    axis: "x",
        //    containment:[-100000,0,75,0]
        //});
    });
})