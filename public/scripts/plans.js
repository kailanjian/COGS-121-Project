let isText = false;

$(document).ready(function() {
  $(".text").hide();
  $("#plan1").click(() => {
    console.log("click");
    $.get("/api/text", (data) => {
      console.log("api get");
      console.log(data);
      $(".content").html(data);
      toggleMode();
    });
  });

  $("#back").click(() => {
    toggleMode();
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