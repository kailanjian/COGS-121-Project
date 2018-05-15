// TIMER CODE
let timer = 0;
let isTimerActive = false;

let dailyCircle = {};
let planCircle = {};

function startTimer() {
  isTimerActive = true;
}

function restartTimer() {
  isTimerActive = true;
  timer = 0;
}

function stopTimer() {
  timer = 0;
  isTimerActive = false;
}

function getTime() {
  return timer;
}

let mainColor = "#4871FF";

function updateChapterTitle(callback) {
  $.yank("/api/plan/" + planId + "/currChapter", (data) => {
    console.log(JSON.stringify(data));
    $("#chapter-title").html(data.currBook + " " + data.currChapNum);
    if (callback) {
      callback();
    }
  });
}

function initPlanData() {
  // load data for total plan
  $.yank("/api/plan/" + planId + "/progress", (data) => {
    loadPlanCircle(data.userChaptersCount, data.totalChapterCount);
  });

  getNonCircleData();
}

/**
 * Yanks data from server for data not in the UI circles
 */
function getNonCircleData() {
  // yanks data for days since started
  $.yank("/api/plan/" + planId + "/days", (data) => {
    $("#plan-days-since").html(Math.round(data.days) + "<br/>");
  });

  // yanks amount of time spent reading
  $.yank("/api/plan/" + planId + "/time", (data) => {
    let hours = data.hours;
    let html;
    if (hours < 10) {
      html = Math.round(data.hours * 10) / 10 + "<br/>";
    } else {
      html = Math.round(data.hours) + "<br/>";
    }
    $("#plan-hours-spent").html(html);
  });
}

function updatePlanData() {
  // load data for total plan
  $.yank("/api/plan/" + planId + "/progress", (data) => {
    updatePlanCircle(data.userChaptersCount, data.totalChapterCount);
  });

  getNonCircleData();
}

$(document).ready(function () {
  $(".text").hide();
  $(".graph").hide();
  $(".back-arrow").hide();

  //update these with actual data
  let chaptersReadToday = 6;
  let dailyChapterGoal = 10;

  initPlanData();
  loadDGCircle(chaptersReadToday, dailyChapterGoal);

  updateChapterTitle();

  $("#nextButton").click(() => {
    console.log("clicked next modified");
    $.thrust("/api/" + planId + "/text/next",
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

  $(".plan-read").click(() => {
    console.log("click");
    startTimer();
    $.yank("/api/" + planId + "/text",
      (data) => {
        startTimer();
        $(".plan-page").hide();
        $(".plan-read").hide();
        $(".text").show();
        $(".content").html(data.passages[0]);
      });
  });

  $("#back").click(() => {
    updateChapterTitle(toggleMode());
  });

  $("#stats").click(() => {
    toggleStats();
  });

  window.setInterval(() => {
    if (document.visibilityState == "visible" && isTimerActive == true) {
      timer++;
    }
  }, 1000)
});

function toggleMode() {
  if (!$(".text").is(":visible")) {
    window.location = "/plans";
  } else {
    updatePlanData();
    $(".plan-page").show();
    $(".plan-read").show();
    $(".text").hide();
  }
}

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
  dailyCircle = loadCircle("#daily-goal-completion", todayRead, dailyChapterGoal);
}

function updateDGCircle(todayRead, dailyChapterGoal) {
  $("#daily-goal-title").html(todayRead + " of " + dailyChapterGoal);
  animateCircle(dailyCircle, todayRead, dailyChapterGoal);
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

  planCircle = loadCircle("#total-plan-completion", totalRead, totalChapters);
}

function updatePlanCircle(totalRead, totalChapters) {
  let percentText = Math.round(totalRead / totalChapters * 100) + "%";
  $("#total-goal-title").html(percentText);
  $("#total-goal-desc").html(totalRead + "/" + totalChapters + "<br/>chapters read");
  animateCircle(planCircle, totalRead, totalChapters);
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
  animateCircle(circle, part, total);
  return circle;
}

function animateCircle(circle, part, total) {
  let completion = part / total;
  circle.animate(completion > 1 ? 1 : completion);
}