let readData = [
    {label: "done", data: 10, color: "#ffb900"},
    {label: "not done", data: 30, color: "#fcf2d7"}
];

$(document).ready(function () {
    $.plot('#percent-read-chart', readData, {
        series: {
            pie: {
                innerRadius: 0.3,
                radius: .9,
                show: true,
                label: {
                    show: false
                },
                stroke: {
                    width: 0,
                    // color: "#CCCCCC"
                }
            }
        },
        legend: {
            show: false
        }
    });

    $("#percent-read-nums").html(
        readData[0].data + "/" + (readData[0].data + readData[1].data)
    )

});