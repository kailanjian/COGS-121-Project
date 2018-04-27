let readPercentageData = [
    {label: "done", data: 10, color: "#ffb900"},
    {label: "not done", data: 30, color: "#fcf2d7"}
];

let hoursReadData = [];
let hoursReadAverages = [];

$(document).ready(function () {
    //generate random hours read data
    for (let i = 0; i < 30; i++) {
        let randomTime = 3 * Math.random();
        hoursReadData.push([i, randomTime]);
    }

    //generate moving averages
    for (let i = 2; i < 28; i++) {
        let time = 0;
        for (let x = -2; x <= 2; x++) {
            time += hoursReadData[i + x][1];
        }
        time /= 5;
        hoursReadAverages.push([i, time]);
    }

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

<<<<<<< HEAD
    // user data
    loadUser();

});

function loadUser()
{
    $.get('/api/user', (user) => {

    });
}
=======
    $.plot(".profile-chart", [hoursReadData, hoursReadAverages]);
});
>>>>>>> 54f3b9e05ed49b043830a77134611cfd7e479ee2
