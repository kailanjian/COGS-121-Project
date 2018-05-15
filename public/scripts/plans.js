let isText = false;

$(document).ready(function () {
  $(".text").hide();
  $("#plan1").click(() => {
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
