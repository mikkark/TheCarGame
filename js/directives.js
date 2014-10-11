'use strict'

app.directive('canvas', function () {
    return {
        templateNamespace: 'svg',
        template: '<svg ng-click="add()" height="400" style="display: inline-block" width="60%" ng-transclude></svg>',
        restrict: 'E',
        replace: true,
        transclude: true,
        link: function(scope, element, attr) {
            scope.add = function() {
                if (scope.addDevice) {
                    scope.devices.push({ name: 'new device ' + scope.devices.length, X: 100, Y: 100 });
                }
            };
        }
    }
});

app.directive('powermeter', function () {
    return {
        template: '<div style="height: {{device.speed}}px;background-color: red"></div>',
        restrict: 'E',
        transclude: true,
        replace: true
    };
});

app.directive('device', function () {
    return {
        templateNamespace: 'svg',
        template: '<circle r=10 data-name="{{device.name}}" ng-attr-cx="{{device.X}}" ng-attr-cy="{{device.Y}}" style="background-color: #105cb6"></circle>',
        restrict: 'E',
        replace: true,
        transclude: true,
        link: function(scope, element, attr) {

            var device = scope.device;

            var keyup = Rx.Observable.fromEvent(document, 'keyup');
            var keydown = Rx.Observable.fromEvent(document, 'keydown');

            var keyFilter = function (kbevent) {
                return kbevent.key === device.gas;
            };

            keydown.filter(keyFilter).select(function(kb) {
                return kb.keyCode;
            }).selectMany(function(keyCode){
                return Rx.Observable.timer(100, 100).select(function () { return keyCode; })
            })
            .takeUntil(keyup.filter(keyFilter))
            .repeat()
            .subscribe(function () {
                device.accelerate();
                scope.$apply();
            });

            keyup.filter(keyFilter).subscribe(function() {
               device.break();
                scope.$apply();
            });
        }
    };
});

app.directive('movingobject', ['observeOnScope', function(observeOnScope) {
    return {
        link: function(scope, element, attr) {

            var speedChanges = observeOnScope(scope, 'device.speed').filter(function(speed) {
                return speed.newValue > 0;
            }).selectMany(function(oldValNewVal) {
                console.log('select many');
                return Rx.Observable.timer(0, convertPowerToMovementSpeed(oldValNewVal.newValue)).select(function () { return oldValNewVal.newValue; })
            })
            .takeWhile(function() { return scope.device.speed > 0; })//TODO: this line violates good practice, try to change
            .repeat();

            speedChanges.subscribe(function() {
                scope.device.X = scope.device.X + 1;
            });
        }
    };
}]);