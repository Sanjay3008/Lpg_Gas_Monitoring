
$(document).ready(function () {
    $(".dis_table").DataTable();
    $(".hamburger").click(function () {
        $(".wrapper").toggleClass("collapse_side");
    });
    $(".sidebar #tabs li a:first").addClass("active");
    $(".item").hide();
    $(".item:first").show();
    $(".sidebar #tabs li a").click(function () {
        var id = $(this).attr("id");
        $(".sidebar #tabs li a").removeClass("active");
        $(this).addClass("active");
        $(".item").hide();
        $("#" + id + "C").fadeIn();

    });
})