let readPercentageData = [
  {label: "done", data: 10, color: "#ffb900"},
  {label: "not done", data: 30, color: "#fcf2d7"}
];

let hoursReadData = [];
let chaptersReadData = [];
let chaptersReadThisWeek = 0;
let totalChaptersRead = 0;
let totalTimeRead = 0;
let averageTimePerChapter = 0;
let timeThisWeek = 0;
const sevenDaysInMS = 604800000;

const dayOfWeek = ["Mon", "Tue", "Wed", "Thr", "Fri", "Sat", "Sun"];

const options = {
  series: {},
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
    min: 0,
    color: "black",
    tickDecimals: 0,
  },
};

let dataSet = [
  {
    label: "Minutes Read",
    data: hoursReadData,
    color: "#4871FF",
    bars: {
      show: true,
      align: "right",
      barWidth: 24 * 60 * 60 * 600,
      lineWidth: 1,
    }
  }, {
    label: "Chapters Read",
    data: chaptersReadData,
    color: "#444444",
    bars: {
      show: true,
      align: "right",
      barWidth: 24 * 60 * 60 * 600,
      lineWidth: 1,
    }
  }
];

function yankProfileData(callback) {
  $.yank('/api/user/' + username + "/timedata", (data) => {
    processProfileData(data);
    callback();
  });
}

/**
 * Checks whether day is within 7 days of today
 * @param day - day we're checking
 */
function withinWeek(date) {
  return new Date() - date < sevenDaysInMS;
}


function processProfileData(data) {
  // each element in data is a chapter
  totalChaptersRead = data.length;

  let profileData = combineEachDaysData(data);
  putDataIntoArrays(profileData);

  // avg time per chapter
  averageTimePerChapter = (totalTimeRead / totalChaptersRead) / 3600;
}

function combineEachDaysData(data) {
  let profileData = {};
  data.forEach((element) => {
    // add up time for total time
    totalTimeRead += parseInt(element.time) / 3600;

    let date = new Date(element.date);
    if (withinWeek(date)) {
      // we do this to combine single days into one
      let day = JSON.stringify(minimizeDayData(date));
      if (profileData[day]) {
        timeThisWeek += parseInt(profileData[day].time) / 60;
        profileData[day].time = parseInt(profileData[day].time) + parseInt(element.time);
        profileData[day].chapters++;
      } else {
        profileData[day] = {time: element.time, chapters: 1};
      }
    }
  });
  return profileData;
}

function minimizeDayData(date) {
  return {
    month: date.getMonth(),
    day: date.getDate(),
    year: date.getFullYear(),
  };
}

function putDataIntoArrays(profileData) {
  let todayDate = new Date();
  let today = minimizeDayData(todayDate);
  let iteratedDate = new Date();
  iteratedDate.setDate(todayDate.getDate() - 7);

  let iter, iterString, data;
  do {
    iter = minimizeDayData(iteratedDate);
    iterString = JSON.stringify(iter);
    data = profileData[iterString];

    // change date format for the stupid chart
    let tdd = transformDateData(iter);
    let timeSpent = 0;
    let chaptersRead = 0;

    if (data) {
      timeSpent = data.time / 60;
      chaptersRead = data.chapters
    }

    hoursReadData.push([tdd, timeSpent]);
    chaptersReadData.push([tdd, chaptersRead]);
    chaptersReadThisWeek += chaptersRead;

    iteratedDate.setDate(iteratedDate.getDate() + 1);

  } while (!sameDay(today, iter));

}

// checks whether d1 and d2 are the same day
function sameDay(d1, d2) {
  return d1.day == d2.day && d1.month == d2.month && d1.year == d2.year;
}

function transformDateData(d) {
  return new Date(d.year, d.month, d.day).getTime();
}

$(document).ready(function () {
  yankProfileData(() => {
    $.plot(".profile-chart", dataSet, options);
    $("#ch-read-wk").html(chaptersReadThisWeek);
    $("#ch-read-total").html(totalChaptersRead);
    $("#time-total").html(Math.round(totalTimeRead));
    $("#time-per-ch").html(Math.round(timeThisWeek));
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

});
