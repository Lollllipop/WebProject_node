$(function() { // 문서의 모든 로딩 후에 실시

  $('#search-bar').keyup(function() { // 키보드에서 손을 떼어냈을 때 실행
    var query = $('#search-bar').val() || ""; // value를 담고
    query = query.trim(); //공백 제거

    $('.fa-spin').css('display', 'block'); // spinner를 돌리자..

    $.ajax({
      url: '/suggestEvents', // suggest로 get
      data: {keyword: query}, // get방식의 접근이니까 req.query에 keyword가 추가되어서 전달
      success: function(data) { // 성공시 data로 response 데이터를 받음
        // 화면에 받은 결과를 가지고 list를 rendering하고..
        var els = data.map(function(name) { // map?
          return '<li>' + name + '</li>';
        });
        $('.suggest-box').html(els.join('\n')).show(); // html형태로 추가 html에

        // li item을 클릭했을 때, text box의 내용을 바꾸고, suggest-box감춤
        $('.suggest-box li').click(function(e) {
          $('#search-bar').val($(e.currentTarget).text());
          $('.suggest-box').hide();
        });
      },
      complete: function() {
        $('.fa-spin').css('display', 'none'); // spinner를 정지
      }
    });
  });

});