

function showBitDates() {
    if (window.innerWidth > 480) {
        $('#dates').fadeIn();
    } else {
        var dates_mobile_close = document.getElementById("dates_mobile_close");
        if (dates_mobile_close == null) {
            $('#dates_mobile').append('<span id="dates_mobile_close" onclick="hideBitDates()">X</span>');
        }
        $('#dates_mobile').fadeIn();
    }
}

/*-- main functions --*/
$(function () {

    // Year
    const y = new Date();
    let year = y.getFullYear();
    document.getElementById("current_year").innerHTML = year;

    // Sign up form
    $(".modal .btn-close").on("click", function (e) {
        e.preventDefault();
        $(".modal").removeClass('open-modal');
        $("body").removeClass("body-overlay");
        return false;
    });

    // Apple form
    $('.pre-add').click(function () {
        $(".modal").removeClass('open-modal');
        $(".apple-modal").toggleClass('open-modal');
        $("body").toggleClass("body-overlay");
    });
});
/*-- main functions --*/



// hide video overlay
function hideVideo() {
    var videoOverlay = document.getElementById("videoOverlay");
    videoOverlay.classList.toggle("hide");
}

function toggleVideoSound() {
    var video=document.getElementById("demons-video");
    video.muted = !video.muted;
    if(video.muted) {
        $('#toggleVideoSound').addClass('muted');
        $('#toggleVideoSound').removeClass('unmuted');
    } else {
        $('#toggleVideoSound').addClass('unmuted');
        $('#toggleVideoSound').removeClass('muted');
    }
}
  