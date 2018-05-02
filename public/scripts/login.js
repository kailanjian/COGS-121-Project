$(document).ready(function () {
    $("#reg-forms").hide();
    console.log("boi");

    let registration = false;

    $(".tog-button").click(() => {
        if(registration == false){
            $("#reg-forms").show();
            $("#login-forms").hide();
            registration = true;
        }
        else{
            $("#reg-forms").hide();
            $("#login-forms").show();
            registration = false;
            console.log("WENT INTO THE ELSE BOI");
        }
    })



});


