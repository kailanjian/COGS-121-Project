const sevenDaysInMS = 604800000;
const fade_speed = 200;

// graph data
let friend_data = [];
let dataSet = [
  {data: friend_data, color: "#CCCCCC"}
];
let ticks = [];
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
    fillColor: {colors: [{opacity: 0.8}, {opacity: 0.8}]},
    lineWidth: 1
  },
  xaxis: {
    // max: 40,
    min: 0,
    tickColor: "#5E5E5E",
    color: "black"
  },
  yaxis: {
    tickColor: "#5E5E5E",
    ticks: ticks,
    tickLength: 0,
    color: "black",
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
  // append all users to the data list to get a simple dropdown working
  $.get("/api/users/all", (data) => {
    console.log("got data" + data);
    for (let i = 0; i < data.length; i++) {
      $("#friends-data-list").append("<option value=" + data[i].username + ">");
    }
  });

  /**
   * UI Events
   */
  $("#add-friend-button").click(() => {
    $(".add-friend-background").fadeIn(fade_speed);
  });

  $("#add-friend-cancel").click(() => {
    $(".add-friend-background").fadeOut(fade_speed);
  });

  $("#friends-data-list-button").click(() => {
    $(".add-friend-background").fadeOut(fade_speed);
  });


  // initialize lists
  updateLists();

  // TODO populate pending-friends-list from server data
  // TODO populate request-friends-list from server data
  // TODO populate friends list from server data

  $("#friends-data-list-button").click(() => {
    let friend = $("#friends-data-list-list").val();
    $.post("/api/friends/add", {username: friend}, (data) => {
      if (data.error) {
        // TODO replace alert with bootstrap cleaner alert
        alert(data.error);
      }
      else {
        updateLists()
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
      $.post("/api/friends/add", {username: $(this).attr("data-friend-username")}, (data) => {
        if (data.error) {
          // TODO handle error
        } else {
          console.log("UPDATING");
          updateLists();
        }
      })
    });
  });

  // REMOVED
  $.get("/api/friends/get/requested", (data) => {
    console.log("got requested friends" + JSON.stringify(data));
    $("#request-friends-list").loadTemplate("#request-friend-template", data);
  });

  $.get("/api/friends/get/confirmed", (data) => {
    console.log("got confirmed friends" + JSON.stringify(data));
    updateGraphData(data);

    //get link to profile
    data.forEach((e) => {
      e.link = "/profile/" + e.username;
    });
    console.log(data);
    $("#confirmed-friends-list").loadTemplate("#confirmed-friend-template", data);
  });
}


function updateGraphData(data) {
  for (let friendIndex = 0; friendIndex < data.length; friendIndex++) {
    let e = data[friendIndex];
    $.yank('/api/user/' + e.username + '/timedata', (td) => {
      let chaptersReadThisWeek = 0;
      for (let i = 0; i < td.length; i++) {
        if (withinWeek(td[i].date)) {
          chaptersReadThisWeek++;
        }
      }

      friend_data.push([chaptersReadThisWeek, friendIndex]);
      ticks.push([friendIndex, e.username]);

      // if last element create the graph
      if (friend_data.length == data.length) {
        console.log(friend_data);
        console.log(ticks);
        $.plot($(".friends-graph"), dataSet, graphOptions);
      }
    });
  }
}

function withinWeek(date) {
  return new Date() - date < sevenDaysInMS;
}