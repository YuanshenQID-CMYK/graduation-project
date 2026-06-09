// index1.js - 轮播、滚动卡片、主题切换、管理系统跳转（Vue Router 优先）
(function($) {
  // 统一初始化函数
  window.initHomePage = function() {
    // ========== 轮播效果 ==========
    var $carouselUl = $('#li5boxul');
    if ($carouselUl.length) {
      var $carouselItems = $carouselUl.find('.li5box-car');
      var itemCount = $carouselItems.length;
      if (itemCount === 0) return;
      var itemWidth = $carouselItems.first().outerWidth(true);
      
      $carouselUl.css('width', itemCount * itemWidth + 'px');
      var maxOffset = -(itemCount - 1) * itemWidth;
      var currentOffset = 0;

      $('#leftimg').off('click').on('click', function() {
        var newOffset = currentOffset - itemWidth;
        if (newOffset < maxOffset) newOffset = 0;
        currentOffset = newOffset;
        $carouselUl.css('transform', 'translate3d(' + currentOffset + 'px, 0, 0)');
      });
      
      $('#rightimg').off('click').on('click', function() {
        var newOffset = currentOffset + itemWidth;
        if (newOffset > 0) newOffset = maxOffset;
        currentOffset = newOffset;
        $carouselUl.css('transform', 'translate3d(' + currentOffset + 'px, 0, 0)');
      });
    }

    // ========== 左侧个人卡片滚动跟随 ==========
    var $mycard = $('#mycard');
    if ($mycard.length) {
      var mycardTop = $mycard.offset().top;
      $(window).off('scroll.scrollCard').on('scroll.scrollCard', function() {
        var scrollTop = $(window).scrollTop();
        if (scrollTop > mycardTop) {
          $mycard.addClass('scroll');
        } else {
          $mycard.removeClass('scroll');
        }
      });
      $(window).off('resize.updateCardTop').on('resize.updateCardTop', function() {
        mycardTop = $mycard.offset().top;
      });
    }

    // ========== 白天/黑夜主题切换 ==========
    var $themeSwitch = $('#myRadio');
    $themeSwitch.off('click').on('click', function() {
      $('body').toggleClass('dark-mode');
      $(this).toggleClass('active');
    });
  };

  $(document).ready(function() {
    window.initHomePage();
  });
})(jQuery);