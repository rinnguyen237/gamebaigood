/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


$(document).ready(function () {
    // Tạo sự kiện on click cho nút "click me!"
    $(".toggle-side-menu").on('click', function () {
        $(".side-menu").addClass("menu-show");
    });

    $(".close-menu").on('click', function () {
        $(".side-menu").removeClass("menu-show");
    });

    $("#click_popup").click(function() {
        $(".show_popup").css("display", "block");
    });

    $(".btn_close").click(function() {
        $(this).parent().parent().hide();
    });




});



$(document).ready(function () {

    $("#owl-demo").owlCarousel({
        navigation: true,
        pagination: false, // Show next and prev buttons
        slideSpeed: 300,
        paginationSpeed: 400,
        singleItem: true,
        autoPlay: false,
    });

   

});


$(function () {
    $("#tabs").tabs();
});


