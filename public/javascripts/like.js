$(function() {

  $('#like-button').click(function() { 
    $.ajax({
      url: `${event_.id}/like`,
      type: 'POST',
      success: function(data) {
        $('.num-votes').text(data);
        $("#like-button").addClass('disabled_');
        $("#like-button").css('width', '150px');
        $(".fa-thumbs-up").text(" 좋아요 완료");
      }
    });
  });

});