const fade_speed = 200;

// graph data
let friend_data = [
 [30,0],[25,1],[10,2]
];
let dataSet = [
  { data: friend_data, color: "#CCCCCC" }
];
let ticks = [
  [0, "boi"], [1, "new"], [2, "You"]
];
var graphOptions = {
  series: {
    bars: {
      show: true
    }
  },
  bars: {
    align: "center",
    barWidth: 0.5,
    horizontal: true,
    fillColor: { colors: [{ opacity: 0.8 }, { opacity: 0.8}] },
    lineWidth: 1
  },
  xaxis: {
    axisLabel: "Chapters Read Last 7 Days",
    axisLabelUseCanvas: true,
    axisLabelFontSizePixels: 12,
    axisLabelFontFamily: 'Verdana, Arial',
    axisLabelPadding: 10,
    max: 40,
    tickColor: "#5E5E5E",
    color:"black"
  },
  yaxis: {
    axisLabel: "Precious Metals",
    axisLabelUseCanvas: true,
    axisLabelFontSizePixels: 12,
    axisLabelFontFamily: 'Verdana, Arial',
    axisLabelPadding: 3,
    tickColor: "#5E5E5E",
    ticks: ticks,
    tickLength: 0,
    color:"black"
  },
  legend: {
    noColumns: 0,
    labelBoxBorderColor: "#858585",
    position: "ne"
  },
  grid: {
    hoverable: true,
    borderWidth: 1,
    backgroundColor: "#FFFFFF"
  }
};

$(document).ready(function () {
  $.get("/api/users/all", (data) => {
    console.log("got data" + data);
    for (let i = 0; i < data.length; i++) {
      $("#friends-data-list").append("<option value=" + data[i].username + ">");
    }
  });

  $.plot($(".friends-graph"), dataSet, graphOptions);

  $(".add-friend-background").hide();

  /**
   * UI Events
   */
  $("#add-friend-button").click(() => {
    $(".add-friend-background").fadeIn(fade_speed);
  });

  $("#add-friend-cancel").click(() => {
    $(".add-friend-background").fadeOut(fade_speed);
  });


  updateLists();

  // TODO populate pending-friends-list from server data
  // TODO populate request-friends-list from server data
  // TODO populate friends list from server data

  $("#friends-data-list-button").click(() => {
    let friend = $("#friends-data-list-list").val();
    $.post("/api/friends/add", {username: friend}, (data) => {
      if (data.error) {
        console.log(data.error);
      }
      else {
        $("#request-friends-list").append(genPendingFriendsListItem(friend, 0));
      }
    });
    // add 
    // TODO get ID
    // TODO post friend request to server
    // TODO check if friend is actually existing (can be done on server)
  });


});

function genPendingFriendsListItem(friendName, friendId) {
  return '<li class="pending-friends-list-item" id=' + friendId + ' >' + friendName + '</li>';
}

function updateLists() {
  $.get("/api/friends/get/pending", (data) => {
    console.log("got pending friends" + JSON.stringify(data));
    $("#pending-friends-list").loadTemplate("#pending-friend-template", data);

    $(".confirm-friend-req-button").click(function () {
      console.log("button");
      console.log(this);
      $.post("/api/friends/add", {username: $(this).attr("data-friend-username")}, (data) => {
        if (data.error) {
          // TODO handle error
        } else {
          console.log("UPDATING")
          updateLists();
        }
      })
    });
  });
  $.get("/api/friends/get/requested", (data) => {
    console.log("got requested friends" + JSON.stringify(data));
    $("#request-friends-list").loadTemplate("#request-friend-template", data);
  });
  $.get("/api/friends/get/confirmed", (data) => {
    console.log("got confirmed friends" + JSON.stringify(data));
    $("#confirmed-friends-list").loadTemplate("#confirmed-friend-template", data);
  });
}
