// main javascript file
// Note: ALL VARIABLES HERE WILL BE GLOBAL
let isText = false;
let isStats = false;

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

function toggleStats() {
  if (isStats == true) {
    $(".graph").hide()
  } else {
    $(".graph").show()
  }
  isStats = !isStats;
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
    if (st + $(window).height() < $(document).height() + 200) {
      $('header').removeClass('nav-up').addClass('nav-down');
    }
  }

  lastScrollTop = st;
}