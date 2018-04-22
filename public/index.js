// main javascript file
// Note: ALL VARIABLES HERE WILL BE GLOBAL

$(document).ready(function() {
  for (let i=0; i<10; i++)
  {
    console.log("for");
//j    $(".garbage").append($(".voytek").clone());
  }
  $.get("api/user", (data) => {

    console.log(data);
  });
});
