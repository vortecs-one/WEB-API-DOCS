//= require ./lib/_energize
//= require ./app/_copy
//= require ./app/_toc
//= require ./app/_lang

function adjustLanguageSelectorWidth() {
  const elem = $('.dark-box > .lang-selector');
  elem.width(elem.parent().width());
}

$(function() {
  // The fixed top bar covers the top of the viewport, so headings are
  // considered "current" relative to the bottom edge of that bar.
  var scrollOffset = 10 + ($('.topbar').outerHeight() || 0);
  loadToc($('#toc'), '.toc-link', '.toc-list-h2', scrollOffset);
  setupLanguages($('body').data('languages'));
  $('.content').imagesLoaded( function() {
    window.recacheHeights();
    window.refreshToc();
  });

  $(window).resize(function() {
    adjustLanguageSelectorWidth();
  });
  adjustLanguageSelectorWidth();
});

window.onpopstate = function() {
  activateLanguage(getLanguageFromQueryString());
};
