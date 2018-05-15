$(document).ready(function () {
  $(".add-plan-background").hide();

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

  $("#cancel-button").click(()=>{
    $(".add-plan-background").fadeOut();
  });

  $("#done-button").click(() => {
    $(".add-plan-background").fadeOut();
    let firstBook = $("#first-book-select").val();
    let lastBook = $("#last-book-select").val();
    let planName = $("#plan-name-select").val();

    $.post("/api/plan/add", {
      planName: planName,
      firstBook: firstBook,
      lastBook: lastBook
    });
  });
});