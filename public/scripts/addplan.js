$(document).ready(function () {
  $("#done-button").click(() => {
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
