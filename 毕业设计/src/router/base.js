(function ($) {
  // 如果不需要 initActive 的功能，可以定义为空函数或直接省略调用
  function initActive() {
    // 页面激活时的初始化逻辑可以写在这里
    // 例如：设置导航菜单的激活状态
    var currentPath = window.location.hash;
    if (currentPath) {
      $('.navbtn[href="' + currentPath + '"]').parent().addClass('active');
    }
  }

  function bindEvenInit() {
    $('.navbtn').bind("click touch", function () {
      $('html,body').animate({ 
        scrollTop: ($($(this).attr('href')).offset().top - 100) 
      }, 500);
      return false;
    });
  }

  // 执行初始化
  initActive();
  bindEvenInit();

  // 个人卡片滚动固定
  var mycard = $('#mycard');
  if (mycard.length) {
    var mycardTop = mycard.offset().top;
    
    $(window).on('scroll', function () {
      var scrollTop = $(window).scrollTop();
      if (scrollTop > mycardTop) {
        mycard.addClass('scroll');
      } else {
        mycard.removeClass('scroll');
      }
    });
  }

  // 遮罩层关闭
  $('#zhezhao > .close').on('click', function () {
    $('#zhezhao').toggleClass('active');
    var video = document.getElementById('videoResumeC');
    if (video && !$('#zhezhao').hasClass('active')) {
      video.pause();
    }
  });

  // 移动端菜单
  $('#minmenu').on('click', function () {
    $('#minmenu, .menu_list').toggleClass('active');
  });

  // Loading 动画
  $(window).on('load', function () {
    var $loading = $('.lodding-wrap');
    if ($loading.length) {
      $loading.fadeOut(300);
    }
  });
})(jQuery);