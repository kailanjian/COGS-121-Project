console.log("boiboiboibobiobi")

$(document).ready(function() {
  $.get("/api/users/all", (data) => {
    console.log("got data" + data);
    for (let i = 0; i < data.length; i++)
    {
      $("#friends-data-list").
        append("<option value=" + data[i].username + ">" );
    }
  });

  $.get("/api/friends/get/pending", (data) => {
    console.log("got pending friends" + JSON.stringify(data));
    $("#pending-friends-list").loadTemplate("#pending-friend-template", data);
    $(".pending-friend-button").click(function () {
      console.log("button");
      console.log(this);
      $.post("/api/friends/add", {username: $(this).attr("data-friend-username")})
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

  // TODO populate pending-friends-list from server data
  // TODO populate request-friends-list from server data
  // TODO populate friends list from server data

  $("#friends-data-list-button").click(() => {
    let friend = $("#friends-data-list-list").val();
    $.post("/api/friends/add", {username: friend}, (data) => {
      if (data.error) {
        console.log(data.error);
      }
      else
      {
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