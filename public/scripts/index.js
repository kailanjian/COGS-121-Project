// main javascript file
// Note: ALL VARIABLES HERE WILL BE GLOBAL
let isText = false;
let isStats = false;


$(document).ready(function() {
  $(".text").hide();
  $(".graph").hide();
  $("#resume_button").click(() => {
    console.log("click");
    $.get("/api/text", (data) => {
      console.log("api get");
      console.log(data);
      $(".content").html(data.passages[0]);
      toggleMode();
    });
  });

  $("#back").click(() => {
    toggleMode();
  });

  $("#stats").click(() => {
    toggleStats();
  });
});

function toggleMode() {
  if (!isText) {
    $(".plans").hide();
    $(".text").show();
  } else {
    $(".text").hide();
    $(".plans").show();
  }
  isText = !isText; 
}
function toggleStats(){
  if(isStats == true){
    $(".graph").hide()
  } else {
    $(".graph").show()
  }
  isStats = !isStats;
}