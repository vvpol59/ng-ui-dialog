/**
 * директива диалогового окна а-ля jQuery.dialog
 * Created by vvpol on 17.09.2016.
 */
(function(){
    "use strict";
    var app = angular.module('dialogApp', []),
        dialogOverlay = angular.element('<div class="ng-ui-dialog-overlay" style="display: none"></div>'), // Экран для модальных диалогов
        current = {},  // текущие данные для перетаскивания и ресайзинга
    dialogList = {};  // Список диалогов по их uid
    /**
     * Инициализация перетаскивания по mousedown
     * @param e
     * @param uid
     */
    function initDraggable(e, uid){
        current.offsetX = e.offsetX;
        current.offsetY = e.offsetY;
        current.dialog = dialogList[uid].dialog;
        angular.element(document).one('mouseup', function(e) {
            angular.element(document).off('mousemove');
        });
        angular.element(document).on('mousemove', function(e) {
            current.dialog.css({
                left: e.pageX - current.offsetX - 10 + 'px',
                top: e.pageY - current.offsetY - 10 + 'px'
            });
        });
    }

    /**
     * Инициализация ресайзинга
     * @param e
     */
    function initResize(e){
        current.dialog = angular.element(e.target.parentNode);
        // Начальное положение диалога
        current.bottom = current.dialog[0].offsetTop + current.dialog[0].offsetHeight;
        current.top = current.dialog[0].offsetTop;
        current.left = current.dialog[0].offsetLeft;
        current.right = current.dialog[0].offsetLeft + current.dialog[0].offsetWidth;
        current.dir = e.target.className.split('-')[3]; // Направление ресайзинга
        console.log(current);
        angular.element(document).one('mouseup', function(e){
            angular.element(document).off('mousemove');
        });
        angular.element(document).on('mousemove', function(e){
            var dir = current.dir,
                pos = {
                    top: current.dialog[0].offsetTop,
                    left: current.dialog[0].offsetLeft,
                    height: current.dialog[0].offsetHeight - 10, // padding + border
                    width: current.dialog[0].offsetWidth - 10
                },
                css = {
                    top: pos.top + 'px',
                    left: pos.left + 'px',
                    height: pos.height + 'px',
                    width: pos.width + 'px'
                };
            pos.bottom = pos.top + pos.height;
            pos.right = pos.left + pos.width;
            if ((dir == 'n') || (dir == 'ne') || (dir == 'nw')){ // Верхние движки
                css.top =  e.pageY + 'px';
                css.height = pos.bottom - e.pageY + 'px';
            }
            if ((dir == 's') || (dir == 'se') || (dir == 'sw')){ // Нижние движки
                css.height = e.pageY - pos.top + 'px';
            }
            if ((dir == 'w') || (dir == 'nw') || (dir == 'sw')){ // левые движки
                css.left = e.pageX + 'px';
                css.width = pos.right - e.pageX + 'px';
            }
            if ((dir == 'e') || (dir == 'ne') || (dir == 'se')){ // Правые движки
                css.width = e.pageX - pos.left + 'px'
            }
            current.dialog.css(css);
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
        par = JSON.parse(params);
        for (var item in par){
            def[item] = par[item];
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
        var params = definePar((attr.params == undefined) ? '{}' : attr.params),
            label = '',
            uid = attr.uid;
        // Прорисовка заголовка
        if (typeof(params.title) == 'string'){
            var btns = params['close-btn'] ? '<div class="dialog-close-btn" n--g-click="closeDialog(' + uid + ')"></div>' : '',
                dragClass = params.draggable ? ' dialog-draggable' : '';
            label = '<div class="ng-ui-dialog-handler"><div class="dialog-title' + dragClass + '">' + params.title + '</div>' + btns + '</div>';
        }
        var templateElement = angular.element('<div class="ng-ui-dialog" style="display:none" n--g-show="showDialog' + uid + '">' + label + '</div>');
        dialogList[uid] = {dialog: templateElement, params: params};
        dialog.wrap($compile(templateElement)(scope)); // Оборачивание формы диалога
        // Обёртывание диалога в рамки
        templateElement.append(angular.element(
            '<div style="z-index: 90;" class="dialog-border dialog-border-n"></div>' +
            '<div style="z-index: 90;" class="dialog-border dialog-border-e"></div>' +
            '<div style="z-index: 90;" class="dialog-border dialog-border-s"></div>' +
            '<div style="z-index: 90;" class="dialog-border dialog-border-w"></div>' +
            '<div style="z-index: 90;" class="dialog-border dialog-border-se"></div>' +
            '<div style="z-index: 90;" class="dialog-border dialog-border-sw"></div>' +
            '<div style="z-index: 90;" class="dialog-border dialog-border-ne"></div>' +
            '<div style="z-index: 90;" class="dialog-border dialog-border-nw"></div>'
        ));
        // Управление видимостью
        if (scope.dialogsVisible == undefined){
            scope.dialogsVisible = {};
        }
        scope.dialogsVisible[uid] = false;
        scope.$watch('dialogsVisible["' + uid + '"]',function(value){
            if (value){ // Показать
                // Если модальное - ставим экран
                if (dialogList[uid].params.modal){
                    dialogOverlay.css('display', '')
                }
                dialogList[uid].dialog.css('z-index', 51);
            } else {
                dialogOverlay.css('display', 'none')
            }
            dialog.parent().css('display', value ? '' : 'none');
        });
        // Обработчик крестика
        var closeBtn = dialog.parent()[0].getElementsByClassName('dialog-close-btn');
        if (closeBtn.length == 1){
            closeBtn[0].addEventListener('click', function(e){
                scope.$apply(function(scope) {

                    scope.dialogsVisible[uid] = false;
                });
            });
        }
    }

    /**
     * Привязка событий диалогового окна
     * @param scope
     * @param dialog
     * @param attr
     */
    function post(scope, dialog, attr){
        var widget = dialog.parent(),
            uid = attr.uid,
            params = dialogList[uid].params;
        // Инициализация перетаскивания
        if (params.draggable){ // Задано перетаскивание
            if (typeof(params.title) == 'string') { // За заголовок
                var handler = widget[0].getElementsByClassName('dialog-title');
                if (handler.length == 1){
                    angular.element(handler[0]).on('mousedown', function (e) {
                        initDraggable(e, uid);
                    });
                }
            }
        }
        // Инициализвция ресайзинга
        if (params.resizable){
            widget.addClass('dialog-resizable');
            var resizers = widget[0].getElementsByClassName('dialog-border');
            // всем хандлерам размера ставим событие на mousedown
            for (var i = 0; i < resizers.length; i++){
                angular.element(resizers[i]).on('mousedown', initResize);
            }
        }
    }

    app.directive('ngUiDialog', ["$compile", function($compile) {
        angular.element(document.querySelector("body")).append(dialogOverlay);
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
})();
