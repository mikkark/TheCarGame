/**
 * Created by karkkmik on 5.11.2014.
 */
describe('directive: car', function () {
    var element, scope;

    console.log('create app');

    //app = angular.module('app');

    console.log('hei');
    console.log(app);

    beforeEach(inject(function($rootScope, $compile) {
        scope = $rootScope.$new();

        element = '<car></car>';

        element = $compile(element)(scope);
        scope.$apply();
    }));

    describe('when steering wheel not turned', function () {
        it('wheels should be straight', function () {
            var isolated = element.scope();
            expect(isolated).not.toBe(null);
        });
    });

});
