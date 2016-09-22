/**
 * Created by vvpol on 17.09.2016.
 */
(function(){
    "use strict";
    var app = angular.module('Test', []),
        drag = {},
        dialogs = {};
    var dialogList = {};
    app.$inject = ["$scope"];
    function initDraggable(e, el, uid){
        drag.offsetX = e.offsetX;
        drag.offsetY = e.offsetY;
        drag.dialog = dialogList[uid].dialog;
        angular.element(document).one('mouseup', function(e) {
            angular.element(document).off('mousemove');
        });
        angular.element(document).on('mousemove', function(e) {
            drag.dialog.css({
                left: e.pageX - drag.offsetX + 'px',
                top: e.pageY - drag.offsetY + 'px'
            });
        });
    }

    /**
     * Формирование параметров диалога
     * @param params
     * @returns {*}
     */
    function definePar(params){
        var def = { // Параметры по умолчанию
            'handler-class': null,
            draggable: false,
            position: 'center',
            resizable: false,
            'close-btn': true,
            modal: true,
            title: null
        },
            par;
        // Распаковка параметров
        for (var i = 0; i < params.length; i++){
            par = params[i].split(':');
            par[1] = par[1].trim();
            if ((par[1] == 'true') || (par[1] == 'false')){
                par[1] = (par[1] == 'true');
            }
            def[par[0].trim()] = par[1];
        }
        return def;
    }

    /**
     * Инициализация диалогового окна
     * @param $compile
     * @param scope
     * @param dialog
     * @param attr
     */
    function pre($compile, scope, dialog, attr) {
        var params = definePar((attr.params == undefined) ? [] : attr.params.split(',')),
            label = '',
            uid = attr.uid;

      //  dialog.parent().data('params', params);
        // Прорисовка заголовка
        if (typeof(params.title) == 'string'){
            var btns = params['close-btn'] ? '<div class="dialog-close-btn" ng-click="closeClick(' + uid + ')">X</div>' : '',
                dragClass = params.draggable ? ' dialog-draggable' : '';
            label = '<div class="ng-ui-dialog-handler"><div class="dialog-title' + dragClass + '">' + params.title + '</div>' + btns + '</div>';
        }
        var templateElement = angular.element('<div class="ng-ui-dialog" ng-show="showDialog' + uid + '">' + label + '</div>');
        dialogList[uid] = {dialog: templateElement, params: params};
        dialog.wrap($compile(templateElement)(scope));
    }

    function post(scope, dialog, attr){
        var widget = dialog.parent(),
            uid = attr.uid,
            params = dialogList[uid].params;
        // Инициализация перетаскивания
        if (params.draggable){ // Задано перетаскивание
            if (typeof(params.title) == 'string') { // За заголовок
                var handler = widget[0].getElementsByClassName('dialog-title');
                if (handler.length == 1){
                    var $hnd = angular.element(handler[0]);
                    $hnd.on('mousedown', function (e) {
                        initDraggable(e, $hnd, uid);
                    });
                }
            }
        }
        // Инициализвция ресайзинга
        if (params.resizable){

        }

    }

    app.directive('ngUiDialog', ["$compile", function($compile) {
        return {
            priority: 1,
            compile: function(dialog, attr) {
                return {
                    pre: function(scope, dialog, attr){
                        pre($compile, scope, dialog, attr);
                    },
                    post: function(scope, dialog){
                        post(scope, dialog, attr);

                    }
                }
            }

        }
    }]);

    app.controller('testApp', function($scope){
        $scope.showDialog1 = false;
        $scope.showDialog = function(dialog){
            $scope['showDialog' + dialog] = !$scope['showDialog' + dialog];
        };
        $scope.closeClick = function(uid){
            $scope['showDialog' + uid] = false;
            console.log(uid);
        }
    });
})();
