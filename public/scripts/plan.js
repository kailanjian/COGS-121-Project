// main javascript file
// Note: ALL VARIABLES HERE WILL BE GLOBAL
let isText = false;
let isStats = false;
let reading = false;

let mainColor = "#4871FF";

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

  //update these with actual data
  let chaptersReadToday = 6;
  let dailyChapterGoal = 10;
  let totalChaptersRead = 100;
  let totalChaptersGoal = 300;

  loadDGCircle(chaptersReadToday, dailyChapterGoal);
  loadPlanCircle(totalChaptersRead, totalChaptersGoal);

  updateChapterTitle();

  $("#nextButton").click(() => {
    console.log("clicked next modified");
    $.get("/api/" + planId + "/text/next", (data) => {
      console.log("api get next");
      console.log(data);
      $('html,body').scrollTop(0);
      $(".content").html(data.passages[0]);
    });
  });

  $(".resume-button").click(() => {
    console.log("click");
    $.get("/api/" + planId + "/text", (data) => {
      console.log("api get");
      console.log(data);
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
});

function toggleMode() {
  if (!isText) {
    $(".plan-page").hide();
    $(".text").show();
  } else {
    $(".plan-page").show();
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

/**
 * Loads daily goal circle
 * @param todayRead number of chapters read this day
 * @param dailyChapterGoal daily goal (# of chapters)
 */
function loadDGCircle(todayRead, dailyChapterGoal) {
  $("#daily-goal-title").html(todayRead + " of " + dailyChapterGoal);
  loadCircle("#daily-goal-completion", todayRead, dailyChapterGoal);
}

/**
 * Loads total goal circle
 * @param totalRead total # of chapters read
 * @param totalChapters total # of chapters needed to read to finish
 */
function loadPlanCircle(totalRead, totalChapters) {
  let percentText = Math.round(totalRead / totalChapters * 100) + "%";
  $("#total-goal-title").html(percentText);
  $("#total-goal-desc").html(totalRead + "/" + totalChapters + "<br/>chapters read");

  loadCircle("#total-plan-completion", totalRead, totalChapters);


}

/**
 * Loads circle in element
 * @param element - jquery-style selection. e.g. "#element"
 * @param part - how much the user has read
 * @param total - how much the user plans to read
 */
function loadCircle(element, part, total) {
  let circle = new ProgressBar.Circle(element, {
    color: mainColor,
    // This has to be the same size as the maximum width to
    // prevent clipping
    strokeWidth: 4,
    trailWidth: 1,
    easing: 'easeInOut',
    duration: 1400,
    from: {color: '#aaa', width: 2},
    to: {color: mainColor, width: 3},
    // Set default step function for all animate calls
    step: function (state, circle) {
      circle.path.setAttribute('stroke', state.color);
      circle.path.setAttribute('stroke-width', state.width);
    }
  });
  //make sure only go through circle once
  let completion = part / total;
  circle.animate(completion > 1 ? 1 : completion);
}