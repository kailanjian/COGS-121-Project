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
        }
    })

    $("#login-forms").submit(function (event) {
        event.preventDefault();
        console.log("login submit");
    
        $.post("/login",
        {
            "username": $("#login-username").val(),
            "password": $("#login-password").val()
        }).done((data) => 
        {
            console.log("posted");
            if (data.error)
            {
                console.log("error");
                alert(error)
            }
            else
            {
                console.log(data);
                window.location.replace("/plans");
            }
        }).fail((err) => 
        {
            alert("Failed to authenticate!");
        });
   });

    $("#reg-forms").submit(function (event) {
        event.preventDefault();
        console.log("reg submit");
        let username= $("#reg-username").val();
        let password = $("#reg-password").val();
        let verify = $("#reg-verify").val();
        
        if (password != verify)
        {
            alert("Password does not match!");
            return;
        }

        $.post("/register",
        {
            "username": username,
            "password": password,
            "verify": verify
        }).done((data) => 
        {
            console.log("posted");
            if (data.error)
            {
                console.log("error");
                alert(error)
            }
            else
            {
                console.log(data);
                window.location.replace("/plans");
            }
        }).fail((err) => {
            alert("Failed to register");
        });
   });
});
