/* 
frontend js for plans page
handles progress fills bar using progress from 
backend endpoints
*/

function loadPercentages() {
  plansData.forEach( (plan) => {
    $.yank("/api/plan/" + plan._id + "/progress", (data) => {
      let progressWidth = Math.round(data.userChaptersCount / data.totalChapterCount * 100);
        $("#"+plan._id).css("width", progressWidth + "%");
    })
  });
}


$(document).ready(function () {
  loadPercentages();

  $("#current-label").click(function () {
    $("#current-plans").show();
    $('#current-label hr').css('visibility', 'visible');
    $("#completed-plans").hide();
    $('#completed-label hr').css('visibility', 'hidden');
  });
  $("#completed-label").click(function () {
    $("#completed-plans").show();
    $('#completed-label hr').css('visibility', 'visible');
    $("#current-plans").hide();
    $('#current-label hr').css('visibility', 'hidden');
  });

  $(".create-plan-link").click(() => {
    $(".add-plan-background").fadeIn();
  });

  $("#cancel-button").click(() => {
    $(".add-plan-background").fadeOut();
  });

  $("#done-button").click(() => {
    $(".add-plan-background").fadeOut();
    let firstBook = $("#first-book-select").val();
    let lastBook = $("#last-book-select").val();
    let planName = $("#plan-name-select").val();
    let dailyGoal = $("#daily-ch-goal-input").val();
    console.log(dailyGoal);

    $.post("/api/plan/add", {
      planName: planName,
      firstBook: firstBook,
      lastBook: lastBook,
      goal: dailyGoal
    });
  });
});

function validate(evt) {
  var theEvent = evt || window.event;
  var key = theEvent.keyCode || theEvent.which;
  key = String.fromCharCode(key);
  var regex = /[0-9]|[\b]/;
  if (!regex.test(key)) {
    theEvent.returnValue = false;
    if (theEvent.preventDefault) theEvent.preventDefault();
  }
}