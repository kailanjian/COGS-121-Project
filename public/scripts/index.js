// main javascript file
// Note: ALL VARIABLES HERE WILL BE GLOBAL
/*
let isText = false;
let isStats = false;
let reading = false;

function updateChapterTitle(callback) {
  $.get("/api/currChapter", (data) => {
    $("#chapter-title").html(data.currBook + " " + data.currChapNum);
    if (callback) {
      callback();
    }
  });
}

$(document).ready(function () {
  $(".text").hide();
  $(".graph").hide();
  $(".back-arrow").hide();

  updateChapterTitle();

  $("#nextButton").click(() => {
    console.log("clicked next");
    $.get("/api/text/next", (data) => {
      console.log("api get next");
      console.log(data);
      $('html,body').scrollTop(0);
      $(".content").html(data.passages[0]);
    });
  });

  $(".plans").click(() => {
    console.log("click");
    $.get("/api/text", (data) => {
      console.log("api get");
      console.log(data);
      $(".content").html(data.passages[0]);
      toggleMode();
    });
  });

  $("#back").click(() => {
    if(isText) {
      updateChapterTitle(toggleMode());
    } else  {
      window.location.replace("/plans");
    }
  });

  $("#stats").click(() => {
    toggleStats();
  });
});

function toggleMode() {
  if (!isText) {
    $(".plans").hide();
    $(".all_graphs").hide();
    $(".text").show();
  } else {
    $(".text").hide();
    $(".all_graphs").show();
    $(".plans").show();
  }
  isText = !isText;
}

//
// function toggleStats() {
//   if (isStats == true) {
//     $(".graph").hide()
//   } else {
//     $(".graph").show()
//   }
//   isStats = !isStats;
//}

