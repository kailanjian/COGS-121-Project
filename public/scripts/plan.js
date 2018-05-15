// main javascript file
// Note: ALL VARIABLES HERE WILL BE GLOBAL
let isText = false;
let isStats = false;
let reading = false;

// TIMER CODE
let timer = 0;
let isTimerActive = false;

function startTimer() 
{
  isTimerActive = true;
}
function restartTimer() 
{
  isTimerActive = true;
  timer = 0;
}
function stopTimer()
{
  timer = 0;
  isTimerActive = false;
}
function getTime()
{
  return timer;
}


console.log("JS LOADED");


function updateChapterTitle(callback) {
  $.get("/api/plan/" + planId + "/currChapter", (data) => {
    console.log("boibooibobioboiib");
    console.log(JSON.stringify(data));
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
    console.log("clicked next modified");
    $.post("/api/" +planId + "/text/next", 
      {
        "time": getTime()
      },
      (data) => {
        restartTimer();
        console.log("api get next");
        console.log(data);
        $('html,body').scrollTop(0);
        $(".content").html(data.passages[0]);
      });
  });
  
  $(".plans").click(() => {
    console.log("click");
    startTimer();
    $.get("/api/" + planId + "/text", 
      (data) => {
        startTimer();
        $(".content").html(data.passages[0]);
        toggleMode();
      });
  });

  $("#back").click(() => {
    updateChapterTitle(toggleMode());
  });

  $("#stats").click(() => {
    toggleStats();
  });

  window.setInterval(() => 
    {
      if (document.visibilityState == "visible" && isTimerActive == true)
      {
        timer++;
      }
    }, 1000)
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

/*
Head navbar animation
 */
var didScroll;
var lastScrollTop = 0;
var delta = 5;
var navbarHeight = $('header').outerHeight();

$(window).scroll(function (event) {
  didScroll = true;
});

setInterval(function () {
  if (didScroll) {
    hasScrolled();
    didScroll = false;
  }
}, 250);

function hasScrolled() {
  var st = $(window).scrollTop();

  // Make sure they scroll more than delta
  if (Math.abs(lastScrollTop - st) <= delta)
    return;

  // If they scrolled down and are past the navbar, add class .nav-up.
  // This is necessary so you never see what is "behind" the navbar.
  if (st > lastScrollTop && st > navbarHeight) {
    // Scroll Down
    $('header').removeClass('nav-down').addClass('nav-up');
  } else {
    // Scroll Up
    if (st + $(window).height() < $(document).height()) {
      $('header').removeClass('nav-up').addClass('nav-down');
    }
  }

  lastScrollTop = st;
}