let readPercentageData = [
  {label: "done", data: 10, color: "#ffb900"},
  {label: "not done", data: 30, color: "#fcf2d7"}
];

let hoursReadData = [];
let hoursReadAverages = [];

var dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thr", "Fri", "Sat"];

var options = {
  series: {
  },
  bars: {
    align: "center",
    barWidth: 0.5,
  },
  xaxes: [{
    mode: "time",
    tickFormatter: function (val, axis) {
      return dayOfWeek[new Date(val).getDay()];
    },
    color: "black",
  }],
  yaxis: {
    color: "black",
    tickDecimals: 2,
  },
};

let dataSet = [
  {
    label: "Hours Read",
    data: hoursReadData,
    bars: {
      show: true,
      align: "right",
      barWidth: 24 * 60 * 60 * 600,
      lineWidth:1
    }
  }
];

function yankProfileData(callback) {
  $.yank('/api/user/' + username + "/timedata", (data) => {
    processProfileData(data);
    callback();
  });
}

function processProfileData(data) {
  let dayAndTime = {};
  data.forEach((element) => {
    let date = new Date(element.date);
    let day = JSON.stringify({
      month: date.getMonth() + 1,
      day: date.getDate(),
      year: date.getFullYear(),
    });
    if (dayAndTime[day]) {
      dayAndTime[day] = parseInt(dayAndTime[day]) + parseInt(element.time);
    } else {
      dayAndTime[day] = element.time;
    }
  });

  for (let e in dayAndTime) {
    if (dayAndTime[e]) {
      let d = [transformDateData(e), dayAndTime[e] / 3600];
      hoursReadData.push(d);
    }
  }
  console.log(hoursReadData);
}

function transformDateData(dateElement) {
  let d = JSON.parse(dateElement);
  return new Date(d.year, d.month, d.day).getTime();
}

$(document).ready(function () {
  yankProfileData(() => {
    $.plot(".profile-chart", dataSet, options);
  });

  $.plot('#percent-read-chart', readPercentageData, {
    series: {
      pie: {
        innerRadius: 0.5,
        radius: .9,
        show: true,
        label: {
          show: false
        },
        stroke: {
          width: 0
        }
      }
    },
    legend: {
      show: false
    }
  });

  $("#percent-read-nums").html(
    readPercentageData[0].data + "/" + (readPercentageData[0].data + readPercentageData[1].data)
  );

  $(".profile-chart").UseTooltip();
});

$.fn.UseTooltip = function () {
  $(this).bind("plothover", function (event, pos, item) {
    if (item) {
      if ((previousLabel != item.series.label) || (previousPoint != item.dataIndex)) {
        previousPoint = item.dataIndex;
        previousLabel = item.series.label;
        $("#tooltip").remove();

        var x = item.datapoint[0];
        var y = item.datapoint[1];
        var date = new Date(x);
        var color = item.series.color;

        showTooltip(item.pageX, item.pageY, color,
          "<strong>" + item.series.label + "</strong><br>" +
          (date.getMonth() + 1) + "/" + date.getDate() +
          " : <strong>" + y + "</strong> (USD/oz)");
      }
    } else {
      $("#tooltip").remove();
      previousPoint = null;
    }
  });
};

function showTooltip(x, y, color, contents) {
  $('<div id="tooltip">' + contents + '</div>').css({
    position: 'absolute',
    display: 'none',
    top: y - 40,
    left: x - 120,
    border: '2px solid ' + color,
    padding: '3px',
    'font-size': '9px',
    'border-radius': '5px',
    'background-color': '#fff',
    'font-family': 'Verdana, Arial, Helvetica, Tahoma, sans-serif',
    opacity: 0.9
  }).appendTo("body").fadeIn(200);
}
