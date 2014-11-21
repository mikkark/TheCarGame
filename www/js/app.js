var app = angular.module('app', ['rx']);

app.run(function($templateCache) {
    $templateCache.put('track.html', './html/track2.html');
    $templateCache.put('carTemplateOldSkool.html', './html/carTemplateOldSkool.html');
});