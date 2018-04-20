// main javascript file
// Note: ALL VARIABLES HERE WILL BE GLOBAL

$(document).ready(function() {
  for (let i=0; i<10; i++)
  {
    console.log("for");
    $(".garbage").append($(".voytek").clone());
  }
});
