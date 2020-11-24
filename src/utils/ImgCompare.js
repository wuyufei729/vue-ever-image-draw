
import {fabric} from './fabric.js'
import {EVEREXIF} from './ever-exif.js'
import MyTest from '@/utils/myTest.js';
var p1 = MyTest;

debugger;
var Compare = new function () {
    var Transparent = 'rgba(255, 255, 255, 0)';
    var _leftImageObj = null, _leftRotateObj = null, _rightImageObj = null, _rightRotateObj = null;
    var _leftObjs = [], _rightObjs = [];
    var _leftRate, _rightRate;
    var _backgroundColor = 'white';
    var _canvasCompare = null;
    var _currentDrawType = '';
    var _opacity = 0.6;
    var _leftSelected = null;
    var _sceneImageList = null;


    //var _sceneImageList = {
    //    type: 'scene',
    //    rightIndex: rightIndex,
    //    rightItemIndex: rightItemIndex,
    //    left: this.$parent.$parent.searchData.largeCutPicUrl,
    //    right: [{ uId: null, id: null, picList: [] }]
    //};




    var _leftIndex = -1, _rightIndex = -1;
    var _leftSelectedColor = 'red', _rightSelectedColor = 'green', _selectedSize = 10;
    var _isOrgImage = true;
    var _zoomObject = {
        min: 0.1,
        max: 3.0,
        currentLevel: 1.0,
        percent: '100%',
        toString: function () {
            return 'percent:' + this.percent + ' currentLevel:' + this.currentLevel + ' min:' + this.min + ' max:' + this.max;
        }
    };
    //shape: 'sign_line',
    //color: 'white',
    //size: { min: 0, max: 50, value: 30 },
    //isFill: false,
    //isClose: false,
    //isMeasure: false,
    //lineType: 'line', //'arrow' , 'double_arrow', 'double_header'
    //isSolid: true//'solid'//'dotted'

    var _signClassGroup = [new SignClass('sign_line', 'white', 10, false, false, false, 'line', true), new SignClass('sign_rect', 'white', 10, false, false, false, 'line', true), new SignClass('sign_polygon', 'white', 10, false, false, false, 'line', true), new SignClass('sign_ellipse', 'white', 10, false, false, false, 'line', true)];

    function SignClass(shape, color, size, isFill, isClose, isMeasure, lineType, isSolid) {
        var obj = new Object();
        obj.shape = shape;
        obj.color = color ? color : 'black';
        obj.size = size ? size : 1;
        obj.isFill = isFill ? true : false;
        obj.isClose = isClose ? true : false;
        obj.isMeasure = isMeasure ? true : false;
        obj.lineType = lineType ? lineType : 'line';
        obj.isSolid = isSolid ? true : false;
        return obj;
    }

    function _getSignClassWithShape(shape) {
        for (var i = 0; i < _signClassGroup.length; i++) {
            if (_signClassGroup[i].shape === shape) {
                return _signClassGroup[i];
            }
        }
    }

    var _zoomCallback = null, _signCallback = null, _scaleInputCallback = null;

    function _init(canvasId, canvasParentId, zoomChangeCallback, signSelecteCallback, scaleInputCallback) {
        _zoomCallback = zoomChangeCallback;
        _signCallback = signSelecteCallback;
        _scaleInputCallback = scaleInputCallback;
        var compare_canvas = document.getElementById(canvasId), cpmpare_parent = document.getElementById(canvasParentId);
        compare_canvas.width = cpmpare_parent.offsetWidth;
        compare_canvas.height = cpmpare_parent.offsetHeight;
        _canvasCompare = new fabric.Canvas(canvasId, {
            skipTargetFind: false,
            selectable: false,
            selection: false,
            defaultCursor: 'crosshair',
            backgroundColor: _backgroundColor
        });
        _zoomChange();
        _bind();
        canvasInit();
    }

    var _selectedTypeObj = null;
    function canvasInit() {
        _canvasCompare.on({
            'mouse:down': function (options) {
                if (_selectedTypeObj === null && _currentDrawType !== '') {
                    _drawing(options, 'down');
                } else {
                    _hidenBeforeSignShapeObjPoints();
                    _selectedObjectDown(options);
                }
            },
            'mouse:up': function (options) {
                if (_selectedTypeObj === null && _currentDrawType !== '') {
                    _drawing(options, 'up');
                } else {
                    _selectedObjectUp(options);
                }
            },
            'mouse:move': function (options) {
                if (_selectedTypeObj === null && _currentDrawType !== '') {
                    _drawing(options, 'move');
                } else {
                    _selectedObjectMove(options);
                }

            },
            'mouse:down:before': function (options) {
                if (_currentDrawType === '') {
                    _selectedTypeObj = _shapSelectionJudge(options);
                } else {
                    _selectedTypeObj = null;
                }
            }

        });
    }

    function _shapSelectionJudge(options) {
        var xy = _transformMouse(options.e);
        for (var i = _canvasCompare.getObjects().length - 1; i > -1; i--) {
            var obj = _canvasCompare.item(i);
            if (obj.visible && obj.type !== 'text' && _isPointInTarget(xy, obj)) {
                if (obj.tag !== undefined) {
                    return obj.tag;
                } else {
                    var tag = null;
                    if (_currentDrawType !== '') {
                        return tag;
                    }
                    switch (obj.type) {
                        case 'image':
                            tag = {
                                type: 'image',
                                isLeftSelected: obj === _leftImageObj,
                                selecteSignObjIndex: -1,
                                selecteNodeObjIndex: -1
                            };
                            break;
                        case 'rotate_image':
                            tag = {
                                type: 'rotate_image',
                                isLeftSelected: obj === _leftRotateObj,
                                selecteSignObjIndex: -1,
                                selecteNodeObjIndex: -1
                            };
                            break;
                    }
                    return tag;
                }
            }
        }
        return null;
    }

    var _selecteSignObjIndex = -1;

    //type: lineObj.type,
    //isLeftSelected: _leftSelected,
    //selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
    //selecteNodeObjIndex: -1
    var _diffXY = null;
    function _selectedObjectDown(options) {
        if (_selectedTypeObj === null) {
            _selecteSignObjIndex = -1;
            return;
        }
        _leftSelected = _selectedTypeObj.isLeftSelected;
        _leftImageObj.set({
            stroke: _leftSelected ? _leftSelectedColor : Transparent,
            strokeWidth: _leftSelected ? _selectedSize : 0,
            opacity: _leftSelected ? _opacity : 1
        });
        _leftRotateObj.set({ visible: _leftSelected });
        _rightImageObj.set({
            stroke: _leftSelected ? Transparent : _rightSelectedColor,
            strokeWidth: _leftSelected ? 0 : _selectedSize,
            opacity: _leftSelected ? 1 : _opacity
        });
        _rightRotateObj.set({ visible: !_leftSelected });
        if (_leftSelected) {
            _rightImageObj.moveTo(0);
            _rightRotateObj.moveTo(1);
            _leftImageObj.moveTo(2);
            _leftRotateObj.moveTo(3);
        } else {
            _rightImageObj.moveTo(2);
            _rightRotateObj.moveTo(3);
            _leftImageObj.moveTo(0);
            _leftRotateObj.moveTo(1);
        }
        var xyInCanvas = _transformMouse(options.e);
        var obj = null;
        if (_selectedTypeObj.selecteNodeObjIndex !== -1 && _selectedTypeObj.selecteSignObjIndex !== -1) {
            var objGroup = _leftSelected ? _leftObjs[_selectedTypeObj.selecteSignObjIndex] : _rightObjs[_selectedTypeObj.selecteSignObjIndex];
            obj = objGroup[_selectedTypeObj.selecteNodeObjIndex];
            for (var i = 2; i < objGroup.length; i++) {
                _canvasCompare.add(objGroup[i]);
            }
            var signObj = objGroup[0];
            _selecteSignObjIndex = _selectedTypeObj.selecteSignObjIndex;
            if (_signCallback && typeof _signCallback === 'function') {
                _signCallback(new SignClass('sign_' + signObj.tag.type, signObj.stroke, signObj.strokeWidth, signObj.fill !== Transparent, signObj.isClose, objGroup[1].visible, signObj.tag.lineType, signObj.strokeDashArray == null ? true : false));
            }
        } else {
            _selecteSignObjIndex = -1;
            switch (_selectedTypeObj.type) {
                case 'image':
                    obj = _leftSelected ? _leftImageObj : _rightImageObj;
                    break;
                case 'rotate_image':
                    obj = _leftSelected ? _leftRotateObj : _rightRotateObj;
                    break;
            }
        }
        if (obj !== null) {
            _diffXY = xyInCanvas;
            _canvasCompare.renderAll();
        }
    }

    function _selectedObjectMove(options) {
        if (_selectedTypeObj === null || _diffXY === null)
            return;
        var xyInCanvas = _transformMouse(options.e);
        var objGroup, signObj, nodeObj, radians;
        if (_selectedTypeObj.type === 'image') {
            if (_leftSelected) {
                _leftImageObj.set({ left: _leftImageObj.left + xyInCanvas.x - _diffXY.x, top: _leftImageObj.top + xyInCanvas.y - _diffXY.y });
                _leftRotateObj.set({ left: _leftRotateObj.left + xyInCanvas.x - _diffXY.x, top: _leftRotateObj.top + xyInCanvas.y - _diffXY.y });
                _leftObjs.forEach(function (item) { item.forEach(function (obj) { obj.set({ left: obj.left + xyInCanvas.x - _diffXY.x, top: obj.top + xyInCanvas.y - _diffXY.y }); obj.tag.point = obj.getCenterPoint().clone(); }); });
            } else {
                _rightImageObj.set({ left: _rightImageObj.left + xyInCanvas.x - _diffXY.x, top: _rightImageObj.top + xyInCanvas.y - _diffXY.y });
                _rightRotateObj.set({ left: _rightRotateObj.left + xyInCanvas.x - _diffXY.x, top: _rightRotateObj.top + xyInCanvas.y - _diffXY.y });
                _rightObjs.forEach(function (item) { item.forEach(function (obj) { obj.set({ left: obj.left + xyInCanvas.x - _diffXY.x, top: obj.top + xyInCanvas.y - _diffXY.y }); obj.tag.point = obj.getCenterPoint().clone(); }); });
            }
            _intersectRectJudge();
        } else if (_selectedTypeObj.type === 'rotate_image') {
            var roateImageObj = _leftSelected ? _leftRotateObj : _rightRotateObj;
            var rate = _leftSelected ? _leftRate : _rightRate;
            var imageObj = _leftSelected ? _leftImageObj : _rightImageObj;
            var newPointX = roateImageObj.left + xyInCanvas.x - _diffXY.x, newPointY = roateImageObj.top + xyInCanvas.y - _diffXY.y;
            radians = Math.atan2(newPointY - imageObj.top, newPointX - imageObj.left) + Math.PI / 2;
            imageObj.rotate(radians * 180 / Math.PI);
            var orgRatePoint = new fabric.Point(imageObj.left, imageObj.top - imageObj.height * rate / 2 - 100);
            var currentRoatePoint = fabric.util.rotatePoint(orgRatePoint, imageObj.getCenterPoint(), radians);
            roateImageObj.set({ left: currentRoatePoint.x, top: currentRoatePoint.y });
            _intersectRectJudge();
        } else if (_selectedTypeObj.type === 'rotate_sign') {
            //var objGroup = _leftSelected ? _leftObjs[_selectedTypeObj.selecteSignObjIndex] : _rightObjs[_selectedTypeObj.selecteSignObjIndex];
            //var signObj = objGroup[0], roateSignObj = objGroup[2];
            //var newPointX = roateSignObj.getCenterPoint().x + xyInCanvas.x - _diffXY.x, newPointY = roateSignObj.getCenterPoint().y + xyInCanvas.y - _diffXY.y;
            //var radians = Math.atan2(newPointY - signObj.getCenterPoint().y, newPointX - signObj.getCenterPoint().x) + Math.PI / 2;
            //signObj.rotate(radians * 180 / Math.PI);
            //for (var i = 1; i < objGroup.length; i++) {
            //    var currentPoint = fabric.util.rotatePoint(objGroup[i].tag.point.clone(), signObj.getCenterPoint(), radians);
            //    objGroup[i].set({ left: currentPoint.x, top: currentPoint.y });
            //}
        } else if (_selectedTypeObj.type === 'node') {
            objGroup = _leftSelected ? _leftObjs[_selectedTypeObj.selecteSignObjIndex] : _rightObjs[_selectedTypeObj.selecteSignObjIndex];
            signObj = objGroup[0], nodeObj = objGroup[_selectedTypeObj.selecteNodeObjIndex];
            radians = signObj.angle / 180 * Math.PI;
            var realPoint, leftRealPoint, rightRealPoint, leftScreenPoint, rightScreenPoint, centerRealX, centerRealY, centerScreenPoint, width, height;
            switch (signObj.tag.type) {
                case 'line':
                    nodeObj.set({ left: nodeObj.left + xyInCanvas.x - _diffXY.x, top: nodeObj.top + xyInCanvas.y - _diffXY.y });
                    var res = _createLineTypePath(signObj.tag.lineType, [objGroup[3].getCenterPoint(), objGroup[4].getCenterPoint()], false);
                    _canvasCompare.remove(signObj);
                    objGroup[0] = new fabric.Path(res.path, {
                        left: res.center.x,
                        top: res.center.y,
                        stroke: signObj.stroke,
                        strokeWidth: signObj.strokeWidth,
                        strokeDashArray: signObj.strokeDashArray,
                        fill: signObj.fill,
                        evented: false,
                        selectable: false,
                        selection: false,
                        hasControls: false,
                        hasBorders: false,
                        padding: 0,
                        originX: 'center',
                        originY: 'center'
                    });
                    objGroup[0].tag = signObj.tag;
                    _canvasCompare.add(objGroup[0]);
                    objGroup[0].moveTo(_canvasCompare.getObjects().length - objGroup.length - 1);
                    var distance = _get2PonitLength(objGroup[3].getCenterPoint(), objGroup[4].getCenterPoint());
                    objGroup[1].set({ text: '长度:' + Math.round(distance / 96 * 2.54*100)/100 + '厘米', left: signObj.left - signObj.width / 2, top: signObj.top + signObj.height / 2 + 20, width: 135 });
                    objGroup[2].set({ left: signObj.left, top: signObj.top - signObj.height / 2 - 100 });
                    break;
                case 'rect':
                    nodeObj.set({ left: nodeObj.left + xyInCanvas.x - _diffXY.x, top: nodeObj.top + xyInCanvas.y - _diffXY.y });
                    realPoint = fabric.util.rotatePoint(nodeObj.getCenterPoint(), signObj.tag.point, -radians);
                    switch (_selectedTypeObj.selecteNodeObjIndex) {
                        case 3:
                            leftRealPoint = objGroup[4].tag.point.clone();
                            rightRealPoint = objGroup[6].tag.point.clone();
                            leftRealPoint.y = realPoint.y;
                            rightRealPoint.x = realPoint.x;
                            width = Math.abs(realPoint.x - leftRealPoint.x);
                            height = Math.abs(realPoint.y - rightRealPoint.y);
                            centerRealX = (realPoint.x + leftRealPoint.x) / 2;
                            centerRealY = (leftRealPoint.y + rightRealPoint.y) / 2;
                            leftScreenPoint = fabric.util.rotatePoint(leftRealPoint, signObj.tag.point, radians);
                            rightScreenPoint = fabric.util.rotatePoint(rightRealPoint, signObj.tag.point, radians);
                            objGroup[4].set({ left: leftScreenPoint.x, top: leftScreenPoint.y });
                            objGroup[6].set({ left: rightScreenPoint.x, top: rightScreenPoint.y });
                            break;
                        case 4:
                            leftRealPoint = objGroup[3].tag.point.clone();
                            rightRealPoint = objGroup[5].tag.point.clone();
                            leftRealPoint.y = realPoint.y;
                            rightRealPoint.x = realPoint.x;
                            width = Math.abs(realPoint.x - leftRealPoint.x);
                            height = Math.abs(realPoint.y - rightRealPoint.y);
                            centerRealX = (realPoint.x + leftRealPoint.x) / 2;
                            centerRealY = (realPoint.y + rightRealPoint.y) / 2;
                            leftScreenPoint = fabric.util.rotatePoint(leftRealPoint, signObj.tag.point, radians);
                            rightScreenPoint = fabric.util.rotatePoint(rightRealPoint, signObj.tag.point, radians);
                            objGroup[3].set({ left: leftScreenPoint.x, top: leftScreenPoint.y });
                            objGroup[5].set({ left: rightScreenPoint.x, top: rightScreenPoint.y });
                            break;
                        case 5:
                            leftRealPoint = objGroup[6].tag.point.clone();
                            rightRealPoint = objGroup[4].tag.point.clone();
                            leftRealPoint.y = realPoint.y;
                            rightRealPoint.x = realPoint.x;
                            width = Math.abs(realPoint.x - leftRealPoint.x);
                            height = Math.abs(realPoint.y - rightRealPoint.y);
                            centerRealX = (realPoint.x + leftRealPoint.x) / 2;
                            centerRealY = (realPoint.y + rightRealPoint.y) / 2;
                            leftScreenPoint = fabric.util.rotatePoint(leftRealPoint, signObj.tag.point, radians);
                            rightScreenPoint = fabric.util.rotatePoint(rightRealPoint, signObj.tag.point, radians);
                            objGroup[6].set({ left: leftScreenPoint.x, top: leftScreenPoint.y });
                            objGroup[4].set({ left: rightScreenPoint.x, top: rightScreenPoint.y });
                            break;
                        case 6:
                            leftRealPoint = objGroup[5].tag.point.clone();
                            rightRealPoint = objGroup[3].tag.point.clone();
                            leftRealPoint.y = realPoint.y;
                            rightRealPoint.x = realPoint.x;
                            width = Math.abs(realPoint.x - leftRealPoint.x);
                            height = Math.abs(realPoint.y - rightRealPoint.y);
                            centerRealX = (realPoint.x + leftRealPoint.x) / 2;
                            centerRealY = (realPoint.y + rightRealPoint.y) / 2;
                            leftScreenPoint = fabric.util.rotatePoint(leftRealPoint, signObj.tag.point, radians);
                            rightScreenPoint = fabric.util.rotatePoint(rightRealPoint, signObj.tag.point, radians);
                            objGroup[5].set({ left: leftScreenPoint.x, top: leftScreenPoint.y });
                            objGroup[3].set({ left: rightScreenPoint.x, top: rightScreenPoint.y });
                            break;
                    }
                    centerScreenPoint = fabric.util.rotatePoint(new fabric.Point(centerRealX, centerRealY), signObj.tag.point, radians);
                    signObj.set({ left: centerScreenPoint.x, top: centerScreenPoint.y, width: width, height: height, event: false });
                    objGroup[1].set({ text: '周长:' + Math.round((signObj.width + signObj.height) * 2 / 96 * 2.54 *100)/100+ '厘米 面积:' + Math.round((signObj.width * signObj.height) / 96 * 2.54 / 96 * 2.54*100)/100 + '平方厘米 宽度:' + Math.round(signObj.width / 96 * 2.54 *100)/100 + '厘米 高度:' + Math.round(signObj.height / 96 * 2.54 *100)/100+ '厘米', left: centerScreenPoint.x - signObj.width / 2, top: centerScreenPoint.y + height / 2 + 20, width: 135 });
                    objGroup[2].set({ left: centerScreenPoint.x, top: centerScreenPoint.y - height / 2 - 100 });
                    break;
                case 'ellipse':
                    realPoint = fabric.util.rotatePoint(new fabric.Point(nodeObj.left + xyInCanvas.x - _diffXY.x, nodeObj.top + xyInCanvas.y - _diffXY.y), signObj.tag.point, -radians);
                    switch (_selectedTypeObj.selecteNodeObjIndex) {
                        case 3:
                            realPoint.y = nodeObj.tag.point.y;
                            var newPoint = fabric.util.rotatePoint(realPoint.clone(), signObj.tag.point, radians);
                            nodeObj.set({ left: newPoint.x, top: newPoint.y });
                            var tempPoint = new fabric.Point((realPoint.x + objGroup[5].tag.point.x) / 2, objGroup[4].tag.point.y);
                            centerRealX = tempPoint.x;
                            centerRealY = realPoint.y;
                            width = Math.abs(realPoint.x - objGroup[5].tag.point.x);
                            height = signObj.ry * 2;
                            newPoint = fabric.util.rotatePoint(tempPoint, signObj.tag.point, radians);
                            objGroup[4].set({ left: newPoint.x, top: newPoint.y });
                            tempPoint = new fabric.Point((realPoint.x + objGroup[5].tag.point.x) / 2, objGroup[6].tag.point.y);
                            newPoint = fabric.util.rotatePoint(tempPoint, signObj.tag.point, radians);
                            objGroup[6].set({ left: newPoint.x, top: newPoint.y });
                            break;
                        case 4:
                            realPoint.x = nodeObj.tag.point.x;
                            var newPoint = fabric.util.rotatePoint(realPoint.clone(), signObj.tag.point, radians);
                            nodeObj.set({ left: newPoint.x, top: newPoint.y });
                            var tempPoint = new fabric.Point(objGroup[3].tag.point.x, (realPoint.y + objGroup[6].tag.point.y) / 2);
                            centerRealX = realPoint.x;
                            centerRealY = tempPoint.y;
                            width = signObj.rx * 2;
                            height = Math.abs(realPoint.y - objGroup[6].tag.point.y);
                            newPoint = fabric.util.rotatePoint(tempPoint, signObj.tag.point, radians);
                            objGroup[3].set({ left: newPoint.x, top: newPoint.y });
                            tempPoint = new fabric.Point(objGroup[5].tag.point.x, (realPoint.y + objGroup[6].tag.point.y) / 2);
                            newPoint = fabric.util.rotatePoint(tempPoint, signObj.tag.point, radians);
                            objGroup[5].set({ left: newPoint.x, top: newPoint.y });
                            break;
                        case 5:
                            realPoint.y = nodeObj.tag.point.y;
                            var newPoint = fabric.util.rotatePoint(realPoint.clone(), signObj.tag.point, radians);
                            nodeObj.set({ left: newPoint.x, top: newPoint.y });
                            var tempPoint = new fabric.Point((realPoint.x + objGroup[3].tag.point.x) / 2, objGroup[4].tag.point.y);
                            centerRealX = tempPoint.x;
                            centerRealY = realPoint.y;
                            width = Math.abs(realPoint.x - objGroup[3].tag.point.x);
                            height = signObj.ry * 2;
                            newPoint = fabric.util.rotatePoint(tempPoint, signObj.tag.point, radians);
                            objGroup[4].set({ left: newPoint.x, top: newPoint.y });
                            tempPoint = new fabric.Point((realPoint.x + objGroup[3].tag.point.x) / 2, objGroup[6].tag.point.y);
                            newPoint = fabric.util.rotatePoint(tempPoint, signObj.tag.point, radians);
                            objGroup[6].set({ left: newPoint.x, top: newPoint.y });
                            break;
                        case 6:
                            realPoint.x = nodeObj.tag.point.x;
                            var newPoint = fabric.util.rotatePoint(realPoint.clone(), signObj.tag.point, radians);
                            nodeObj.set({ left: newPoint.x, top: newPoint.y });
                            var tempPoint = new fabric.Point(objGroup[3].tag.point.x, (realPoint.y + objGroup[4].tag.point.y) / 2);
                            centerRealX = realPoint.x;
                            centerRealY = tempPoint.y;
                            width = signObj.rx * 2;
                            height = Math.abs(realPoint.y - objGroup[4].tag.point.y);
                            newPoint = fabric.util.rotatePoint(tempPoint, signObj.tag.point, radians);
                            objGroup[3].set({ left: newPoint.x, top: newPoint.y });
                            tempPoint = new fabric.Point(objGroup[5].tag.point.x, (realPoint.y + objGroup[4].tag.point.y) / 2);
                            newPoint = fabric.util.rotatePoint(tempPoint, signObj.tag.point, radians);
                            objGroup[5].set({ left: newPoint.x, top: newPoint.y });
                            break;
                    }
                    centerScreenPoint = fabric.util.rotatePoint(new fabric.Point(centerRealX, centerRealY), signObj.tag.point, radians);
                    signObj.set({ left: centerScreenPoint.x, top: centerScreenPoint.y, rx: width / 2, ry: height / 2, event: false });
                    objGroup[1].set({ text: '周长:' + Math.round((2 * Math.PI * Math.max(width / 2, height / 2) + 4 * Math.abs(width / 2 - height / 2)) / 96 * 2.54*100)/100 + '厘米 面积:' + Math.round(Math.PI * width / 2 * height / 2 / 96 * 2.54 / 96 * 2.54 *100)/100+ '平方厘米', left: centerScreenPoint.x - width / 2, top: centerScreenPoint.y + height / 2 + 20, width: 135 });
                    objGroup[2].set({ left: centerScreenPoint.x, top: centerScreenPoint.y - height / 2 - 100 });
                    break;
                case 'polygon':
                    nodeObj.set({ left: nodeObj.left + xyInCanvas.x - _diffXY.x, top: nodeObj.top + xyInCanvas.y - _diffXY.y });
                    var points = [], minX = null, maxX = null, minY = null, maxY = null;
                    for (var i = 3; i < objGroup.length; i++) {
                        points.push(objGroup[i].getCenterPoint());
                    }
                    var signClass = _getSignClassWithShape('sign_' + signObj.tag.type);
                    var res = _createLineTypePath(signObj.tag.lineType, points, signClass.isClose);
                    _canvasCompare.remove(signObj);
                    objGroup[0] = new fabric.Path(
                        res.path,
                        {
                            left: res.center.x,
                            top: res.center.y,
                            originX: 'center',
                            originY: 'center',
                            fill: signClass.isFill ? signClass.color : Transparent,
                            stroke: signObj.stroke,
                            strokeWidth: signObj.strokeWidth,
                            strokeDashArray: signObj.strokeDashArray,
                            evented: false,
                            selectable: false,
                            selection: false,
                            hasControls: false,
                            hasBorders: false,
                            padding: 0
                        });
                    objGroup[0].tag = signObj.tag;
                    _canvasCompare.add(objGroup[0]);
                    objGroup[0].moveTo(_canvasCompare.getObjects().length - objGroup.length);

                    var textStr = '';
                    var distance = 0;
                    for (var i = 0; i < points.length - 1; i++) {
                        distance += _get2PonitLength(points[i], points[i + 1]);
                    }
                    if (points.length === 2) {
                        textStr = '长度:' + Math.round(distance / 96 * 2.54*100)/100 + '厘米';
                    } else if (points.length === 3) {
                        var angle1 = (Math.atan2(points[0].y - points[1].y, points[0].x - points[1].x) + Math.PI / 2) * 180 / Math.PI;
                        var angle2 = (Math.atan2(points[2].y - points[1].y, points[2].x - points[1].x) + Math.PI / 2) * 180 / Math.PI;
                        textStr = '总长:' + Math.round(distance / 96 * 2.54*100)/100 + '厘米 角度:' + Math.round(Math.abs(angle1 - angle2)*100)/100 + '度';
                    } else if (points.length > 3) {
                        textStr = '总长:' + Math.round(distance / 96 * 2.54*100)/100 + '厘米';
                    }
                    objGroup[1].set({ text: textStr, left: res.center.x - Math.abs(minX - maxX) / 2, top: res.center.y + objGroup[0].width / 2 + 20, width: 135 });
                    objGroup[2].set({ left: res.center.x, top: res.center.x - objGroup[0].width / 2 - 100 });
                    break;

            }
        } else {
            objGroup = _leftSelected ? _leftObjs[_selectedTypeObj.selecteSignObjIndex] : _rightObjs[_selectedTypeObj.selecteSignObjIndex];
            objGroup.forEach(function (obj) { obj.set({ left: obj.left + xyInCanvas.x - _diffXY.x, top: obj.top + xyInCanvas.y - _diffXY.y, event: false, selectable: false }); obj.tag.point = fabric.util.rotatePoint(new fabric.Point(obj.left, obj.top), objGroup[0].getCenterPoint(), -objGroup[0].angle / 180 * Math.PI); });
        }
        _diffXY = xyInCanvas;
        _canvasCompare.renderAll();
    }

    function _selectedObjectUp(options) {
        if (_selectedTypeObj === null || _diffXY === null)
            return;
        var objGroup = _leftSelected ? _leftObjs[_selectedTypeObj.selecteSignObjIndex] : _rightObjs[_selectedTypeObj.selecteSignObjIndex];
        if (objGroup !== undefined) {
            objGroup.forEach(function (obj) { obj.tag.point = fabric.util.rotatePoint(new fabric.Point(obj.left, obj.top), new fabric.Point(objGroup[0].left, objGroup[0].top), -objGroup[0].angle / 180 * Math.PI); });
        }
        _diffXY = null;
        _selectedTypeObj = null;
    }

    function _intersectRectJudge() {
        //var leftRegions, rightRegions, tl, tr, br, bl;
        //tl = fabric.util.rotatePoint(new fabric.Point(_leftImageObj.left - _leftImageObj.width * _leftRate / 2, _leftImageObj.top - _leftImageObj.height * _leftRate / 2), _leftImageObj.getCenterPoint(), _leftImageObj.angle / 180 * Math.PI);
        //tr = fabric.util.rotatePoint(new fabric.Point(_leftImageObj.left + _leftImageObj.width * _leftRate / 2, _leftImageObj.top - _leftImageObj.height * _leftRate / 2), _leftImageObj.getCenterPoint(), _leftImageObj.angle / 180 * Math.PI);
        //br = fabric.util.rotatePoint(new fabric.Point(_leftImageObj.left + _leftImageObj.width * _leftRate / 2, _leftImageObj.top + _leftImageObj.height * _leftRate / 2), _leftImageObj.getCenterPoint(), _leftImageObj.angle / 180 * Math.PI);
        //bl = fabric.util.rotatePoint(new fabric.Point(_leftImageObj.left - _leftImageObj.width * _leftRate / 2, _leftImageObj.top + _leftImageObj.height * _leftRate / 2), _leftImageObj.getCenterPoint(), _leftImageObj.angle / 180 * Math.PI);
        //leftRegions = [
        //    [tl.x, tl.y],
        //    [tr.x, tr.y],
        //    [br.x, br.y],
        //    [bl.x, bl.y]
        //];
        //tl = fabric.util.rotatePoint(new fabric.Point(_rightImageObj.left - _rightImageObj.width * _rightRate / 2, _rightImageObj.top - _rightImageObj.height * _rightRate / 2), _rightImageObj.getCenterPoint(), _rightImageObj.angle / 180 * Math.PI);
        //tr = fabric.util.rotatePoint(new fabric.Point(_rightImageObj.left + _rightImageObj.width * _rightRate / 2, _rightImageObj.top - _rightImageObj.height * _rightRate / 2), _rightImageObj.getCenterPoint(), _rightImageObj.angle / 180 * Math.PI);
        //br = fabric.util.rotatePoint(new fabric.Point(_rightImageObj.left + _rightImageObj.width * _rightRate / 2, _rightImageObj.top + _rightImageObj.height * _rightRate / 2), _rightImageObj.getCenterPoint(), _rightImageObj.angle / 180 * Math.PI);
        //bl = fabric.util.rotatePoint(new fabric.Point(_rightImageObj.left - _rightImageObj.width * _rightRate / 2, _rightImageObj.top + _rightImageObj.height * _rightRate / 2), _rightImageObj.getCenterPoint(), _rightImageObj.angle / 180 * Math.PI);
        //rightRegions = [
        //    [tl.x, tl.y],
        //    [tr.x, tr.y],
        //    [br.x, br.y],
        //    [bl.x, bl.y]
        //];
        //var intersect = PolyBool.intersect({ regions: [leftRegions], inverted: false }, { regions: [rightRegions], inverted: false });
        //if (intersect.regions.length > 0) {
        if (_leftSelected) {
            _leftImageObj.set({ opacity: _opacity });
            _rightImageObj.set({ opacity: 1 });
        } else {
            _leftImageObj.set({ opacity: 1 });
            _rightImageObj.set({ opacity: _opacity });
        }
        //} else {
        //    _leftImageObj.set({ opacity: 1 });
        //    _rightImageObj.set({ opacity: 1 });
        //}
    }

    function _drawing(options, mouseType) {
        if (_currentDrawType === '')
            return;
        var xyInCanvas = _transformMouse(options.e);
        switch (_currentDrawType) {
            case 'sign_line':
                _drawSignLine(xyInCanvas, mouseType);
                break;
            case 'sign_polygon':
                _drawSignPolygon(xyInCanvas, mouseType);
                break;
            case 'sign_rect': 
                _drawSignRect(xyInCanvas, mouseType);
                break;
            case 'sign_ellipse': 
                _drawSignEllipse(xyInCanvas, mouseType);
                break;
            case 'scale':
                _drawScale(xyInCanvas, mouseType);
                break;
            default:
                break;
        }
    }


    var _scaleStorkColor = '#00ff00';
    var _scaleStorkWidth = 2;
    var _signDrawObjGroup = null;

    var _scaleObj = null;
    function _drawScale(xyInCanvas, mouseType) {
        switch (mouseType) {
            case 'down':
                if (_leftSelected) {
                    _leftObjs.forEach(function (objs) { objs.forEach(function (obj) { _canvasCompare.remove(obj); }); });
                    _leftObjs.length = 0;
                } else {
                    _rightObjs.forEach(function (objs) { objs.forEach(function (obj) { _canvasCompare.remove(obj); }); });
                    _rightObjs.length = 0;
                }
                var linePoint = [xyInCanvas.x, xyInCanvas.y, xyInCanvas.x, xyInCanvas.y];
                _scaleObj = new fabric.Line(linePoint, {
                    stroke: _scaleStorkColor,
                    strokeWidth: _scaleStorkWidth,
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    left: xyInCanvas.x,
                    top: xyInCanvas.y,
                    originX: 'center',
                    originY: 'center'
                });
                _canvasCompare.add(_scaleObj).renderAll();
                break;
            case 'move':
                if (_scaleObj) {
                    _scaleObj.set({
                        x2: xyInCanvas.x,
                        y2: xyInCanvas.y,
                        left: (_scaleObj.x1 + xyInCanvas.x) / 2,
                        top: (_scaleObj.y1 + xyInCanvas.y) / 2
                    });
                    _canvasCompare.renderAll();
                }
                break;
            case 'up':
                if (_scaleObj) {
                    _scaleObj.set({
                        x2: xyInCanvas.x,
                        y2: xyInCanvas.y,
                        left: (_scaleObj.x1 + xyInCanvas.x) / 2,
                        top: (_scaleObj.y1 + xyInCanvas.y) / 2
                    });
                    _canvasCompare.renderAll();
                    _showScaleValueInputView();
                }
                _currentDrawType = '';
                break;
        }
    }

    function _showScaleValueInputView() {
        var length = _get2PonitLength(new fabric.Point(_scaleObj.x1, _scaleObj.y1), new fabric.Point(_scaleObj.x2, _scaleObj.y2));
        var vaule = '';
        if (_leftSelected) {
            vaule = Math.round(length / 96 * 2.54 * 100) / 100;
        } else {
            vaule = Math.round(length / 96 * 2.54 * 100) / 100;
        }
        if (_scaleInputCallback !== undefined && _scaleInputCallback !== null) {
            _scaleInputCallback(vaule);
        }
    }
    var _fromXY = null;
    function _drawSignLine(xy, mouseType) {
        var signClass = _getSignClassWithShape(_currentDrawType);
        var res = null;
        switch (mouseType) {
            case 'down':
                _hidenBeforeSignShapeObjPoints();
                _signDrawObjGroup = [];
                res = _createLineTypePath(signClass.lineType, [xy, xy], false);
                var lineObj = new fabric.Path(res.path, {
                    left: res.center.x,
                    top: res.center.y,
                    stroke: signClass.color,
                    strokeWidth: signClass.size,
                    strokeDashArray: signClass.isSolid ? null : [5, 5],
                    fill: signClass.isFill ? signClass.color : Transparent,
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    originX: 'center',
                    originY: 'center'
                });

                lineObj.tag = {
                    type: 'line',
                    lineType: signClass.lineType,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 0
                };

                var text = new fabric.Textbox('长度:0厘米', {
                    left: xy.x,
                    top: xy.y + lineObj.height + 20,
                    width: 0,
                    fill: 'red',
                    fontSize: 20,
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    visible: signClass.isMeasure
                });

                text.tag = {
                    type: text.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 1
                };

                var rotate = new RotateSign({
                    left: xy.x,
                    top: xy.y - 100,
                    radius: 10,
                    fill: 'yellow',
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    originX: 'center',
                    originY: 'center',
                    hoverCursor: 'pointer',
                    visible: false
                });

                rotate.tag = {
                    type: rotate.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 2
                };

                var startPointObj = new Node({
                    left: xy.x,
                    top: xy.y,
                    width: 20,
                    height: 20,
                    fill: 'blue',
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    originX: 'center',
                    originY: 'center',
                    hoverCursor: 'pointer'
                });

                startPointObj.tag = {
                    type: startPointObj.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 3
                };

                var endPointObj = new Node({
                    left: xy.x,
                    top: xy.y,
                    width: 20,
                    height: 20,
                    fill: 'blue',
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    originX: 'center',
                    originY: 'center',
                    hoverCursor: 'pointer'
                });

                endPointObj.tag = {
                    type: endPointObj.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 4
                };
                _signDrawObjGroup.push(lineObj, text, rotate, startPointObj, endPointObj);
                _signDrawObjGroup.forEach(function (obj) { _canvasCompare.add(obj); });
                _canvasCompare.renderAll();
                break;
            case 'move':
                if (_signDrawObjGroup !== null && _signDrawObjGroup.length > 0) {
                    var lineObj = _signDrawObjGroup[0], text = _signDrawObjGroup[1], rotate = _signDrawObjGroup[2], startPointObj = _signDrawObjGroup[3], endPointObj = _signDrawObjGroup[4];
                    res = _createLineTypePath(lineObj.tag.lineType, [startPointObj.getCenterPoint(), xy], false);
                    _canvasCompare.remove(lineObj);
                    _signDrawObjGroup[0] = new fabric.Path(res.path, {
                        left: res.center.x,
                        top: res.center.y,
                        stroke: lineObj.stroke,
                        strokeWidth: lineObj.strokeWidth,
                        strokeDashArray: lineObj.strokeDashArray,
                        fill: lineObj.fill,
                        evented: false,
                        selectable: false,
                        selection: false,
                        hasControls: false,
                        hasBorders: false,
                        padding: 0,
                        originX: 'center',
                        originY: 'center'
                    });
                    _signDrawObjGroup[0].tag = lineObj.tag;
                    lineObj = _signDrawObjGroup[0];
                    _canvasCompare.add(lineObj);
                    lineObj.moveTo(_canvasCompare.getObjects().length - _signDrawObjGroup.length - 1);
                    endPointObj.set({ left: xy.x, top: xy.y });
                    var distance = _get2PonitLength(startPointObj.getCenterPoint(), xy);
                    text.set({ text: '长度:' + Math.round(distance / 96 * 2.54*100)/100 + '厘米', left: lineObj.left - lineObj.width / 2, top: lineObj.top + lineObj.height / 2 + 20, width: 135 });
                    rotate.set({ left: lineObj.left, top: lineObj.top - lineObj.height / 2 - 100 });
                    _canvasCompare.renderAll();
                }
                break;
            case 'up':
                if (_signDrawObjGroup !== null && _signDrawObjGroup.length > 0) {
                    var startPointObj = _signDrawObjGroup[3], endPointObj = _signDrawObjGroup[4];
                    var distance = _get2PonitLength(startPointObj.getCenterPoint(), endPointObj.getCenterPoint());
                    if (distance < 1) {
                        _signDrawObjGroup.forEach(function (obj) { _canvasCompare.remove(obj); });
                        _canvasCompare.renderAll();
                    } else {
                        _signDrawObjGroup.forEach(function (obj) { obj.tag.point = new fabric.Point(obj.left, obj.top); });
                        if (_leftSelected) {
                            _leftObjs.push(_signDrawObjGroup);
                            _selecteSignObjIndex = _leftObjs.length - 1;
                        } else {
                            _rightObjs.push(_signDrawObjGroup);
                            _selecteSignObjIndex = _rightObjs.length - 1;
                        }
                    }
                }
                _signDrawObjGroup = null;
                _currentDrawType = '';
                _fromXY = null;
                break;
        }

    }

    function _createLineTypePath(lineType, points, isClose) {
        var path = [];
        var angle, angle1, angle2, topX, topY, botX, botY, minX, maxX, minY, maxY;
        if (points.length === 1) {
            path.push(['M', points[0].x, points[0].y]);
            path.push(['L', points[0].x, points[0].y]);
            return {
                path: path,
                center: {
                    x: points[0].x,
                    y: points[0].y
                }
            };
        }
        switch (lineType) {
            case 'line':
                path.push(['M', points[0].x, points[0].y]);
                minX = points[0].x, maxX = points[0].x, minY = points[0].y, maxY = points[0].y;
                for (var i = 1; i < points.length; i++) {
                    path.push(['L', points[i].x, points[i].y]);
                    minX = Math.min(minX, path[path.length - 1][1]), maxX = Math.max(maxX, path[path.length - 1][1]), minY = Math.min(minY, path[path.length - 1][2]), maxY = Math.max(maxY, path[path.length - 1][2]);
                    if (i === points.length - 1 && isClose) {
                        path.push(['z']);
                    }
                }
                break;
            case 'arrow':
                path.push(['M', points[0].x, points[0].y]);
                minX = points[0].x, maxX = points[0].x, minY = points[0].y, maxY = points[0].y;
                if (points.length > 1) {
                    angle = Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x) * 180 / Math.PI,
                        angle1 = (angle + 30) * Math.PI / 180,
                        angle2 = (angle - 30) * Math.PI / 180,
                        topX = 20 * Math.cos(angle1),
                        topY = 20 * Math.sin(angle1),
                        botX = 20 * Math.cos(angle2),
                        botY = 20 * Math.sin(angle2);
                    path.push(['M', points[0].x + topX, points[0].y + topY]);
                    minX = Math.min(minX, path[path.length - 1][1]), maxX = Math.max(maxX, path[path.length - 1][1]), minY = Math.min(minY, path[path.length - 1][2]), maxY = Math.max(maxY, path[path.length - 1][2]);
                    path.push(['L', points[0].x, points[0].y]);
                    path.push(['L', points[0].x + botX, points[0].y + botY]);
                    minX = Math.min(minX, path[path.length - 1][1]), maxX = Math.max(maxX, path[path.length - 1][1]), minY = Math.min(minY, path[path.length - 1][2]), maxY = Math.max(maxY, path[path.length - 1][2]);
                    path.push(['M', points[0].x, points[0].y]);
                }
                for (var i = 1; i < points.length; i++) {
                    path.push(['L', points[i].x, points[i].y]);
                    minX = Math.min(minX, path[path.length - 1][1]), maxX = Math.max(maxX, path[path.length - 1][1]), minY = Math.min(minY, path[path.length - 1][2]), maxY = Math.max(maxY, path[path.length - 1][2]);
                    if (i === points.length - 1 && isClose) {
                        path.push(['z']);
                    }
                }
                break;
            case 'double_arrow':
                path.push(['M', points[0].x, points[0].y]);
                minX = points[0].x, maxX = points[0].x, minY = points[0].y, maxY = points[0].y;
                if (points.length > 1) {
                    angle = Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x) * 180 / Math.PI,
                        angle1 = (angle + 30) * Math.PI / 180,
                        angle2 = (angle - 30) * Math.PI / 180,
                        topX = 30 * Math.cos(angle1),
                        topY = 30 * Math.sin(angle1),
                        botX = 30 * Math.cos(angle2),
                        botY = 30 * Math.sin(angle2);
                    path.push(['M', points[0].x + topX, points[0].y + topY]);
                    minX = Math.min(minX, path[path.length - 1][1]), maxX = Math.max(maxX, path[path.length - 1][1]), minY = Math.min(minY, path[path.length - 1][2]), maxY = Math.max(maxY, path[path.length - 1][2]);
                    path.push(['L', points[0].x, points[0].y]);
                    path.push(['L', points[0].x + botX, points[0].y + botY]);
                    minX = Math.min(minX, path[path.length - 1][1]), maxX = Math.max(maxX, path[path.length - 1][1]), minY = Math.min(minY, path[path.length - 1][2]), maxY = Math.max(maxY, path[path.length - 1][2]);
                    path.push(['M', points[0].x, points[0].y]);
                }
                for (var i = 1; i < points.length; i++) {
                    path.push(['L', points[i].x, points[i].y]);
                    minX = Math.min(minX, path[path.length - 1][1]), maxX = Math.max(maxX, path[path.length - 1][1]), minY = Math.min(minY, path[path.length - 1][2]), maxY = Math.max(maxY, path[path.length - 1][2]);
                    if (i === points.length - 1) {
                        angle = Math.atan2(points[i - 1].y - points[i].y, points[i - 1].x - points[i].x) * 180 / Math.PI,
                            angle1 = (angle + 30) * Math.PI / 180,
                            angle2 = (angle - 30) * Math.PI / 180,
                            topX = 30 * Math.cos(angle1),
                            topY = 30 * Math.sin(angle1),
                            botX = 30 * Math.cos(angle2),
                            botY = 30 * Math.sin(angle2);
                        path.push(['M', points[i].x + topX, points[i].y + topY]);
                        minX = Math.min(minX, path[path.length - 1][1]), maxX = Math.max(maxX, path[path.length - 1][1]), minY = Math.min(minY, path[path.length - 1][2]), maxY = Math.max(maxY, path[path.length - 1][2]);
                        path.push(['L', points[i].x, points[i].y]);
                        path.push(['L', points[i].x + botX, points[i].y + botY]);
                        minX = Math.min(minX, path[path.length - 1][1]), maxX = Math.max(maxX, path[path.length - 1][1]), minY = Math.min(minY, path[path.length - 1][2]), maxY = Math.max(maxY, path[path.length - 1][2]);
                        path.push(['M', points[i].x, points[i].y]);
                        if (isClose) {
                            path.push(['L', points[0].x, points[0].y]);
                        }
                    }
                }
                break;
            case 'double_header':
                path.push(['M', points[0].x, points[0].y]);
                minX = points[0].x, maxX = points[0].x, minY = points[0].y, maxY = points[0].y;
                if (points.length > 1) {
                    angle = Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x) * 180 / Math.PI,
                        angle1 = (angle + 90) * Math.PI / 180,
                        angle2 = (angle - 90) * Math.PI / 180,
                        topX = 30 * Math.cos(angle1),
                        topY = 30 * Math.sin(angle1),
                        botX = 30 * Math.cos(angle2),
                        botY = 30 * Math.sin(angle2);
                    path.push(['M', points[0].x + topX, points[0].y + topY]);
                    minX = Math.min(minX, path[path.length - 1][1]), maxX = Math.max(maxX, path[path.length - 1][1]), minY = Math.min(minY, path[path.length - 1][2]), maxY = Math.max(maxY, path[path.length - 1][2]);
                    path.push(['L', points[0].x, points[0].y]);
                    path.push(['L', points[0].x + botX, points[0].y + botY]);
                    minX = Math.min(minX, path[path.length - 1][1]), maxX = Math.max(maxX, path[path.length - 1][1]), minY = Math.min(minY, path[path.length - 1][2]), maxY = Math.max(maxY, path[path.length - 1][2]);
                    path.push(['M', points[0].x, points[0].y]);
                }
                for (var i = 1; i < points.length; i++) {
                    path.push(['L', points[i].x, points[i].y]);
                    minX = Math.min(minX, path[path.length - 1][1]), maxX = Math.max(maxX, path[path.length - 1][1]), minY = Math.min(minY, path[path.length - 1][2]), maxY = Math.max(maxY, path[path.length - 1][2]);
                    if (i === points.length - 1) {
                        angle = Math.atan2(points[i - 1].y - points[i].y, points[i - 1].x - points[i].x) * 180 / Math.PI,
                            angle1 = (angle + 90) * Math.PI / 180,
                            angle2 = (angle - 90) * Math.PI / 180,
                            topX = 30 * Math.cos(angle1),
                            topY = 30 * Math.sin(angle1),
                            botX = 30 * Math.cos(angle2),
                            botY = 30 * Math.sin(angle2);
                        path.push(['M', points[i].x + topX, points[i].y + topY]);
                        minX = Math.min(minX, path[path.length - 1][1]), maxX = Math.max(maxX, path[path.length - 1][1]), minY = Math.min(minY, path[path.length - 1][2]), maxY = Math.max(maxY, path[path.length - 1][2]);
                        path.push(['L', points[i].x, points[i].y]);
                        path.push(['L', points[i].x + botX, points[i].y + botY]);
                        minX = Math.min(minX, path[path.length - 1][1]), maxX = Math.max(maxX, path[path.length - 1][1]), minY = Math.min(minY, path[path.length - 1][2]), maxY = Math.max(maxY, path[path.length - 1][2]);
                        path.push(['M', points[i].x, points[i].y]);
                        if (isClose) {
                            path.push(['L', points[0].x, points[0].y]);
                        }
                    }
                }
                break;
        }
        return {
            path: path,
            center: {
                x: (maxX + minX) / 2,
                y: (maxY + minY) / 2
            }
        };
    }

    function _drawSignRect(xy, mouseType) {
        var signClass = _getSignClassWithShape(_currentDrawType);
        switch (mouseType) {
            case 'down':
                _hidenBeforeSignShapeObjPoints();
                _signDrawObjGroup = [];
                _fromXY = xy;
                var pointLeftTopObj, pointRightTopObj, pointRightBottomObj, pointLeftBottomObj;
                pointLeftTopObj = new Node({
                    left: xy.x,
                    top: xy.y,
                    width: 20,
                    height: 20,
                    fill: 'blue',
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    originX: 'center',
                    originY: 'center'
                });
                pointLeftTopObj.tag = {
                    type: pointLeftTopObj.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 3
                };

                pointRightTopObj = new Node({
                    left: xy.x,
                    top: xy.y,
                    width: 20,
                    height: 20,
                    fill: 'blue',
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    originX: 'center',
                    originY: 'center',
                    hoverCursor: 'pointer'
                });
                pointRightTopObj.tag = {
                    type: pointRightTopObj.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 4
                };
                pointRightBottomObj = new Node({
                    left: xy.x,
                    top: xy.y,
                    width: 20,
                    height: 20,
                    fill: 'blue',
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    originX: 'center',
                    originY: 'center',
                    hoverCursor: 'pointer'
                });
                pointRightBottomObj.tag = {
                    type: pointRightBottomObj.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 5
                };
                pointLeftBottomObj = new Node({
                    left: xy.x,
                    top: xy.y,
                    width: 20,
                    height: 20,
                    fill: 'blue',
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    originX: 'center',
                    originY: 'center',
                    hoverCursor: 'pointer'
                });
                pointLeftBottomObj.tag = {
                    type: pointLeftBottomObj.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 6
                };
                var signRectObj = new fabric.Rect({
                    left: xy.x,
                    top: xy.y,
                    width: 0,
                    height: 0,
                    originX: 'center',
                    originY: 'center',
                    stroke: signClass.color,
                    strokeWidth: signClass.size,
                    strokeDashArray: signClass.isSolid ? null : [5, 5],
                    fill: signClass.isFill ? signClass.color : Transparent,
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0
                });
                signRectObj.tag = {
                    type: signRectObj.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 0
                };
                var rotate = new RotateSign({
                    left: xy.x,
                    top: xy.y - 100,
                    radius: 10,
                    fill: 'yellow',
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    originX: 'center',
                    originY: 'center',
                    hoverCursor: 'pointer',
                    visible: false
                });
                rotate.tag = {
                    type: rotate.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 2
                };
                var text = new fabric.Textbox('周长:0厘米 面积:0平方厘米 宽度:0厘米 高度:0厘米', {
                    left: xy.x,
                    top: xy.y + 20,
                    width: 0,
                    fill: 'red',
                    fontSize: 20,
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    visible: signClass.isMeasure
                });
                text.tag = {
                    type: text.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 1
                };
                _signDrawObjGroup.push(signRectObj, text, rotate, pointLeftTopObj, pointRightTopObj, pointRightBottomObj, pointLeftBottomObj);
                _signDrawObjGroup.forEach(function (obj) { _canvasCompare.add(obj); });
                _canvasCompare.renderAll();
                break;
            case 'move':
                if (_signDrawObjGroup !== null && _signDrawObjGroup.length > 1 && _fromXY) {
                    var signRectObj = _signDrawObjGroup[0], text = _signDrawObjGroup[1], rotate = _signDrawObjGroup[2], pointLeftTopObj = _signDrawObjGroup[3], pointRightTopObj = _signDrawObjGroup[4], pointRightBottomObj = _signDrawObjGroup[5], pointLeftBottomObj = _signDrawObjGroup[6];
                    var centerX = (_fromXY.x + xy.x) / 2, centerY = (_fromXY.y + xy.y) / 2, width = Math.abs(_fromXY.x - xy.x), height = Math.abs(_fromXY.y - xy.y);
                    signRectObj.set({ left: centerX, top: centerY, width: width, height: height });
                    pointLeftTopObj.set({ left: centerX - width / 2, top: centerY - height / 2 });
                    pointRightTopObj.set({ left: centerX + width / 2, top: centerY - height / 2 });
                    pointRightBottomObj.set({ left: centerX + width / 2, top: centerY + height / 2 });
                    pointLeftBottomObj.set({ left: centerX - width / 2, top: centerY + height / 2 });
                    text.set({ text: '周长:' + Math.round((width + height) * 2 / 96 * 2.54 * 100) / 100 + '厘米 面积:' + Math.round((width * height) / 96 * 2.54 / 96 * 2.54 * 100) / 100 + '平方厘米 宽度:' + Math.round(width / 96 * 2.54*100)/100 + '厘米 高度:' + Math.round(height / 96 * 2.54*100)/100 + '厘米', left: centerX - width / 2, top: centerY + height / 2 + 20, width: 135 });
                    rotate.set({ left: centerX, top: centerY - height / 2 - 100 });
                    _canvasCompare.renderAll();
                }
                break;
            case 'up':
                if (_signDrawObjGroup !== null && _signDrawObjGroup.length > 1 && _fromXY) {
                    var signRectObj = _signDrawObjGroup[0], text = _signDrawObjGroup[1], rotate = _signDrawObjGroup[2], pointLeftTopObj = _signDrawObjGroup[3], pointRightTopObj = _signDrawObjGroup[4], pointRightBottomObj = _signDrawObjGroup[5], pointLeftBottomObj = _signDrawObjGroup[6];
                    var centerX = (_fromXY.x + xy.x) / 2, centerY = (_fromXY.y + xy.y) / 2, width = Math.abs(_fromXY.x - xy.x), height = Math.abs(_fromXY.y - xy.y);
                    signRectObj.set({ left: centerX, top: centerY, width: width, height: height });
                    pointLeftTopObj.set({ left: centerX - width / 2, top: centerY - height / 2 });
                    pointRightTopObj.set({ left: centerX + width / 2, top: centerY - height / 2 });
                    pointRightBottomObj.set({ left: centerX + width / 2, top: centerY + height / 2 });
                    pointLeftBottomObj.set({ left: centerX - width / 2, top: centerY + height / 2 });
                    text.set({ text: '周长:' + Math.round((width + height) * 2 / 96 * 2.54 * 100) / 100 + '厘米 面积:' + Math.round((width * height) / 96 * 2.54 / 96 * 2.54 * 100) / 100 + '平方厘米 宽度:' + Math.round(width / 96 * 2.54*100)/100 + '厘米 高度:' + Math.round(height / 96 * 2.54 *100)/100+ '厘米', left: centerX - width / 2, top: centerY + height / 2 + 20, width: 135 });
                    rotate.set({ left: centerX, top: centerY - height / 2 - 100 });

                    if (width * height < 1) {
                        _signDrawObjGroup.forEach(function (obj) { _canvasCompare.remove(obj); });
                    } else {
                        _signDrawObjGroup.forEach(function (obj) { obj.tag.point = new fabric.Point(obj.left, obj.top); });
                        if (_leftSelected) {
                            _leftObjs.push(_signDrawObjGroup);
                            _selecteSignObjIndex = _leftObjs.length - 1;
                        } else {
                            _rightObjs.push(_signDrawObjGroup);
                            _selecteSignObjIndex = _rightObjs.length - 1;
                        }
                    }
                    _canvasCompare.renderAll();
                }
                _signDrawObjGroup = null;
                _currentDrawType = '';
                _fromXY = null;
                break;
        }
    }

    function _drawSignEllipse(xy, mouseType) {
        var signClass = _getSignClassWithShape(_currentDrawType);
        switch (mouseType) {
            case 'down':
                _hidenBeforeSignShapeObjPoints();
                _signDrawObjGroup = [];
                _fromXY = xy;
                var leftObj, topObj, rightObj, bottomObj;
                leftObj = new Node({
                    left: xy.x,
                    top: xy.y,
                    width: 20,
                    height: 20,
                    fill: 'blue',
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    originX: 'center',
                    originY: 'center'
                });
                leftObj.tag = {
                    type: leftObj.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 3
                };
                topObj = new Node({
                    left: xy.x,
                    top: xy.y,
                    width: 20,
                    height: 20,
                    fill: 'blue',
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    originX: 'center',
                    originY: 'center'
                });
                topObj.tag = {
                    type: topObj.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 4
                };
                rightObj = new Node({
                    left: xy.x,
                    top: xy.y,
                    width: 20,
                    height: 20,
                    fill: 'blue',
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    originX: 'center',
                    originY: 'center'
                });
                rightObj.tag = {
                    type: rightObj.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 5
                };
                bottomObj = new Node({
                    left: xy.x,
                    top: xy.y,
                    width: 20,
                    height: 20,
                    fill: 'blue',
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    originX: 'center',
                    originY: 'center'
                });
                bottomObj.tag = {
                    type: bottomObj.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 6
                };
                var signEllipseObj = new fabric.Ellipse({
                    left: xy.x,
                    top: xy.y,
                    rx: 0,
                    ry: 0,
                    originX: 'center',
                    originY: 'center',
                    stroke: signClass.color,
                    strokeWidth: signClass.size,
                    strokeDashArray: signClass.isSolid ? null : [5, 5],
                    fill: signClass.isFill ? signClass.color : Transparent,
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0
                });
                signEllipseObj.tag = {
                    type: signEllipseObj.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 0
                };
                var rotate = new RotateSign({
                    left: xy.x,
                    top: xy.y - 100,
                    radius: 10,
                    fill: 'yellow',
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    originX: 'center',
                    originY: 'center',
                    hoverCursor: 'pointer',
                    visible: false
                });
                rotate.tag = {
                    type: rotate.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 2
                };
                var text = new fabric.Textbox('周长:0厘米 面积:0平方厘米', {
                    left: xy.x,
                    top: xy.y + signEllipseObj.height + 20,
                    width: 0,
                    fill: 'red',
                    fontSize: 20,
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    visible: signClass.isMeasure
                });
                text.tag = {
                    type: text.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: 1
                };
                _signDrawObjGroup.push(signEllipseObj, text, rotate, leftObj, topObj, rightObj, bottomObj);
                _signDrawObjGroup.forEach(function (obj) { _canvasCompare.add(obj); });
                _canvasCompare.renderAll();
                break;
            case 'move':
                if (_signDrawObjGroup !== null && _signDrawObjGroup.length > 1 && _fromXY) {
                    var signEllipseObj = _signDrawObjGroup[0], text = _signDrawObjGroup[1], rotate = _signDrawObjGroup[2], leftObj = _signDrawObjGroup[3], topObj = _signDrawObjGroup[4], rightObj = _signDrawObjGroup[5], bottomObj = _signDrawObjGroup[6];
                    var centerX = (_fromXY.x + xy.x) / 2, centerY = (_fromXY.y + xy.y) / 2, rx = Math.abs(_fromXY.x - xy.x) / 2, ry = Math.abs(_fromXY.y - xy.y) / 2;
                    signEllipseObj.set({ left: centerX, top: centerY, rx: rx, ry: ry });
                    leftObj.set({ left: centerX - rx, top: centerY });
                    topObj.set({ left: centerX, top: centerY - ry });
                    rightObj.set({ left: centerX + rx, top: centerY });
                    bottomObj.set({ left: centerX, top: centerY + ry });
                    text.set({ text: '周长:' + Math.round((2 * Math.PI * Math.max(rx, ry) + 4 * Math.abs(rx - ry)) / 96 * 2.54*100)/100 + '厘米 面积:' + Math.round(Math.PI * rx * ry / 96 * 2.54 / 96 * 2.54*100)/100 + '平方厘米', left: centerX - rx, top: centerY + ry + 20, width: 135 });
                    rotate.set({ left: centerX, top: centerY - ry - 100 });
                    _canvasCompare.renderAll();
                }
                break;
            case 'up':
                if (_signDrawObjGroup !== null && _signDrawObjGroup.length > 1 && _fromXY) {
                    var signEllipseObj = _signDrawObjGroup[0], text = _signDrawObjGroup[1], rotate = _signDrawObjGroup[2], leftObj = _signDrawObjGroup[3], topObj = _signDrawObjGroup[4], rightObj = _signDrawObjGroup[5], bottomObj = _signDrawObjGroup[6];
                    var centerX = (_fromXY.x + xy.x) / 2, centerY = (_fromXY.y + xy.y) / 2, rx = Math.abs(_fromXY.x - xy.x) / 2, ry = Math.abs(_fromXY.y - xy.y) / 2;
                    signEllipseObj.set({ left: centerX, top: centerY, rx: rx, ry: ry });
                    leftObj.set({ left: centerX - rx, top: centerY });
                    topObj.set({ left: centerX, top: centerY - ry });
                    rightObj.set({ left: centerX + rx, top: centerY });
                    bottomObj.set({ left: centerX, top: centerY + ry });
                    text.set({ text: '周长:' + Math.round((2 * Math.PI * Math.max(rx, ry) + 4 * Math.abs(rx - ry)) / 96 * 2.54*100)/100 + '厘米 面积:' + Math.round(Math.PI * rx * ry / 96 * 2.54 / 96 * 2.54*100)/100 + '平方厘米', left: centerX - rx, top: centerY + ry + 20, width: 135});
                    rotate.set({ left: centerX, top: centerY - ry - 100 });

                    if (rx * ry === 0) {
                        _signDrawObjGroup.forEach(function (obj) { _canvasCompare.remove(obj); });
                    } else {
                        _signDrawObjGroup.forEach(function (obj) { obj.tag.point = new fabric.Point(obj.left, obj.top); });
                        if (_leftSelected) {
                            _leftObjs.push(_signDrawObjGroup);
                            _selecteSignObjIndex = _leftObjs.length - 1;
                        } else {
                            _rightObjs.push(_signDrawObjGroup);
                            _selecteSignObjIndex = _rightObjs.length - 1;
                        }
                    }
                    _canvasCompare.renderAll();
                }
                _signDrawObjGroup = null;
                _currentDrawType = '';
                _fromXY = null;
                break;
        }
    }

    var _signLinePolyObj = null;
    function _drawSignPolygon(xy, mouseType) {
        var signClass = _getSignClassWithShape(_currentDrawType);
        var signPolylineObj, res, points, text, rotate;
        switch (mouseType) {
            case 'down':
                var pointObj = new Node({
                    left: xy.x,
                    top: xy.y,
                    width: 20,
                    height: 20,
                    fill: 'blue',
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0,
                    originX: 'center',
                    originY: 'center'
                });
                pointObj.tag = {
                    type: pointObj.type,
                    isLeftSelected: _leftSelected,
                    selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                    selecteNodeObjIndex: _signDrawObjGroup === null ? 3 : _signDrawObjGroup.length
                };
                if (_signDrawObjGroup !== null && _signDrawObjGroup.length > 0) {
                    points = [];
                    for (var i = 3; i < _signDrawObjGroup.length; i++) {
                        points.push(_signDrawObjGroup[i].getCenterPoint());
                    }
                    points.push(xy);
                    res = _createLineTypePath(signClass.lineType, points, false);
                    signPolylineObj = _signDrawObjGroup[0];
                    text = _signDrawObjGroup[1];
                    rotate = _signDrawObjGroup[2];
                    points.push(xy);
                    _signDrawObjGroup[0] = new fabric.Path(
                        res.path,
                        {
                            left: res.center.x,
                            top: res.center.y,
                            originX: 'center',
                            originY: 'center',
                            fill: Transparent,
                            stroke: signClass.color,
                            strokeWidth: signClass.size,
                            strokeDashArray: signClass.isSolid ? null : [5, 5],
                            evented: false,
                            selectable: false,
                            selection: false,
                            hasControls: false,
                            hasBorders: false,
                            padding: 0
                        });
                    _signDrawObjGroup[0].tag = signPolylineObj.tag;
                    var textStr = '';
                    var distance = 0;
                    for (var i = 0; i < points.length - 1; i++) {
                        distance += _get2PonitLength(points[i], points[i + 1]);
                    }
                    if (points.length === 3) {
                        textStr = '长度:' + Math.round(distance / 96 * 2.54 * 100)/100 + '厘米';
                    } else if (points.length === 4) {
                        var angle1 = (Math.atan2(points[0].y - points[1].y, points[0].x - points[1].x) + Math.PI / 2) * 180 / Math.PI;
                        var angle2 = (Math.atan2(points[2].y - points[1].y, points[2].x - points[1].x) + Math.PI / 2) * 180 / Math.PI;
                        textStr = '总长:' + Math.round(distance / 96 * 2.54 * 100)/100 + '厘米 角度:' + Math.round(Math.abs(angle1 - angle2)* 100)/100 + '度';
                    } else if (points.length > 4) {
                        textStr = '总长:' + Math.round(distance / 96 * 2.54* 100)/100 + '厘米';
                    }
                    text.set({ text: textStr, left: res.center.x - _signDrawObjGroup[0].width / 2, top: res.center.y + _signDrawObjGroup[0].height / 2 + 20, width: 135 });
                    rotate.set({ left: res.center.x, top: res.center.y - _signDrawObjGroup[0].height / 2 - 100 });
                    _signLinePolyObj.set({ x1: xy.x, y1: xy.y, x2: xy.x, y2: xy.y });
                    _signDrawObjGroup.push(pointObj);
                    _canvasCompare.remove(signPolylineObj);
                    _canvasCompare.add(_signDrawObjGroup[0]);
                    _canvasCompare.add(pointObj);
                    _signDrawObjGroup[0].moveTo(_canvasCompare.getObjects().length - _signDrawObjGroup.length - 1);
                } else {
                    _hidenBeforeSignShapeObjPoints();
                    _signDrawObjGroup = [];
                    points = [];
                    points.push(xy);
                    res = _createLineTypePath(signClass.lineType, points, false);
                    signPolylineObj = new fabric.Path(
                        res.path,
                        {
                            left: res.center.x,
                            top: res.center.y,
                            originX: 'center',
                            originY: 'center',
                            fill: Transparent,
                            stroke: signClass.color,
                            strokeWidth: signClass.size,
                            strokeDashArray: signClass.isSolid ? null : [5, 5],
                            evented: false,
                            selectable: false,
                            selection: false,
                            hasControls: false,
                            hasBorders: false,
                            padding: 0
                        });
                    signPolylineObj.tag = {
                        type: 'polygon',
                        lineType: signClass.lineType,
                        isLeftSelected: _leftSelected,
                        selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                        selecteNodeObjIndex: 0
                    };
                    rotate = new RotateSign({
                        left: xy.x,
                        top: xy.y - 100,
                        radius: 10,
                        fill: 'yellow',
                        evented: false,
                        selectable: false,
                        selection: false,
                        hasControls: false,
                        hasBorders: false,
                        padding: 0,
                        originX: 'center',
                        originY: 'center',
                        hoverCursor: 'pointer',
                        visible: false
                    });
                    rotate.tag = {
                        type: rotate.type,
                        isLeftSelected: _leftSelected,
                        selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                        selecteNodeObjIndex: 2
                    };
                    text = new fabric.Textbox('', {
                        left: xy.x,
                        top: xy.y + 20,
                        width: 0,
                        fill: 'red',
                        fontSize: 20,
                        evented: false,
                        selectable: false,
                        selection: false,
                        hasControls: false,
                        hasBorders: false,
                        padding: 0,
                        visible: signClass.isMeasure
                    });
                    text.tag = {
                        type: text.type,
                        isLeftSelected: _leftSelected,
                        selecteSignObjIndex: _leftSelected ? _leftObjs.length : _rightObjs.length,
                        selecteNodeObjIndex: 1
                    };
                    _signDrawObjGroup.push(signPolylineObj, text, rotate, pointObj);
                    _signDrawObjGroup.forEach(function (obj) { _canvasCompare.add(obj) });
                    _signLinePolyObj = new fabric.Line([xy.x, xy.y, xy.x, xy.y], {
                        stroke: '#b5b4b4',
                        strokeWidth: 1,
                        evented: false,
                        selectable: false,
                        selection: false,
                        hasControls: false,
                        hasBorders: false,
                        padding: 0
                    });
                    _canvasCompare.add(_signLinePolyObj);
                    _canvasCompare.renderAll();
                }
                break;
            case 'move':
                if (_signLinePolyObj) {
                    _signLinePolyObj.set({ x2: xy.x, y2: xy.y });
                    _canvasCompare.renderAll();
                }
                break;
            case 'up':

                break;
        }
    }

    function _hidenBeforeSignShapeObjPoints() {
        _canvasCompare.forEachObject(function (obj) { if (obj.type === 'node' || obj.type === 'rotate_sign') { _canvasCompare.remove(obj); } }).renderAll();
    }

    function _get2PonitLength(p1, p2) {
        return Math.pow((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y), 0.5);
    }
    function _isPointInTarget(point, target) {
        var canvasObj = target.toCanvasElement(), newPoint = point.clone(), bl, tl, br;
        if (target.angle === 0) {
            bl = target.aCoords.bl;
            tl = target.aCoords.tl;
            br = target.aCoords.br;
        } else {
            bl = fabric.util.rotatePoint(target.aCoords.bl, target.getCenterPoint(), -target.angle * Math.PI / 180);
            tl = fabric.util.rotatePoint(target.aCoords.tl, target.getCenterPoint(), -target.angle * Math.PI / 180);
            br = fabric.util.rotatePoint(target.aCoords.br, target.getCenterPoint(), -target.angle * Math.PI / 180);
            newPoint = fabric.util.rotatePoint(newPoint, target.getCenterPoint(), -target.angle * Math.PI / 180);
        }
        if (newPoint.x > bl.x && newPoint.x < br.x && newPoint.y > tl.y && newPoint.y < bl.y) {
            if (target.type === 'image') {
                return true;
            } else {
                var imageData = canvasObj.getContext('2d').getImageData(point.x - target.getCenterPoint().x + canvasObj.width / 2, point.y - target.getCenterPoint().y + canvasObj.height / 2, 1, 1);
                return imageData.data[3] !== 0;
            }
        }
        return false;
    }

    function _transformMouse(e) {
        return _canvasCompare.getPointer(e, false);
    }

    function _zoomChange() {
        _canvasCompare.on('mouse:wheel', function (options) {
            var delta = options.e.wheelDelta ? options.e.wheelDelta / 40 : options.e.deltaY ? -options.e.deltaY : 0,
                x = options.e.offsetX ? options.e.offsetX : 0, y = options.e.offsetY ? options.e.offsetY : 0;
            if (delta) _zoom(delta, x, y);
        });
    }

    var _zoom = function (delta, x, y) {
        if (delta === 0) {
            return;
        }
        if (_zoomObject.currentLevel > _zoomObject.min && delta < 0) {
            _zoomObject.currentLevel -= 0.1;
        } else if (_zoomObject.currentLevel < _zoomObject.max && delta > 0) {
            _zoomObject.currentLevel += 0.1;
        }
        if(_zoomObject.currentLevel<_zoomObject.min){
            _zoomObject.currentLevel = _zoomObject.min;
        }
        if(_zoomObject.currentLevel > _zoomObject.max){
            _zoomObject.currentLevel = _zoomObject.max;
        }
        var point = new fabric.Point(x, y);
        _canvasCompare.zoomToPoint(point, _zoomObject.currentLevel);
        _canvasCompare.renderAll();
        _zoomObject.percent = Math.round(_zoomObject.currentLevel * 100);
        _zoomChangeListener(_zoomObject);
    };

    function _zoomChangeListener(_zoomObject) {
        if (_zoomCallback && typeof _zoomCallback === "function") {
            _zoomCallback(_zoomObject);
        }
    }

    function _bind() {
        document.getElementsByClassName("upper-canvas")[0].oncontextmenu = function (event) {
            if (_currentDrawType === 'sign_polygon') {
                _signPolylineComplete();
            }
            return false;
        };
    }

    function _signPolylineComplete() {
        _canvasCompare.remove(_signLinePolyObj);
        if (_signDrawObjGroup.length > 4) {
            var signClass = _getSignClassWithShape(_currentDrawType);
            var signPolygonObj = _signDrawObjGroup[0];
            if (signClass.isClose || signClass.isFill) {
                _canvasCompare.remove(_signDrawObjGroup[0]);
                var path = signPolygonObj.path;
                path.push(['z']);
                _signDrawObjGroup[0] = new fabric.Path(path, {
                    left: signPolygonObj.left,
                    top: signPolygonObj.top,
                    originX: 'center',
                    originY: 'center',
                    fill: signClass.isFill ? signPolygonObj.stroke : Transparent,
                    stroke: signPolygonObj.stroke,
                    strokeWidth: signPolygonObj.strokeWidth,
                    strokeDashArray: signPolygonObj.strokeDashArray,
                    evented: false,
                    selectable: false,
                    selection: false,
                    hasControls: false,
                    hasBorders: false,
                    padding: 0
                });
                _signDrawObjGroup[0].tag = signPolygonObj.tag;
                signPolygonObj = _signDrawObjGroup[0];
                _canvasCompare.add(signPolygonObj);
                signPolygonObj.moveTo(_canvasCompare.getObjects().length - _signDrawObjGroup.length);
            }

            _signDrawObjGroup.forEach(function (obj) { obj.tag.point = new fabric.Point(obj.left, obj.top); });
            if (_leftSelected) {
                _leftObjs.push(_signDrawObjGroup);
                _selecteSignObjIndex = _leftObjs.length - 1;
            } else {
                _rightObjs.push(_signDrawObjGroup);
                _selecteSignObjIndex = _rightObjs.length - 1;
            }
            signPolygonObj.moveTo(_canvasCompare.getObjects().length - _signDrawObjGroup.length);
        } else {
            _signDrawObjGroup.forEach(function (obj) { _canvasCompare.remove(obj); });

        }
        _signLinePolyObj = null;
        _signDrawObjGroup = null;
        _currentDrawType = '';
        _canvasCompare.renderAll();
    }

    function _initImage(sceneImageList, rightIndex) {
        _sceneImageList = sceneImageList;
        _canvasCompare.clear();
        var objLeft, objRight, imgSrcLeft, imgSrcRight;
        if (_sceneImageList.length === 0) {
            _leftIndex = -1, _rightIndex = -1;
            _isOrgImage = true;
            _leftObjs.length = 0, _rightObjs.length = 0;
            _leftRate = 1, _rightRate = 1;
        } else if (_sceneImageList.length === 1) {
            _leftIndex = 0, _rightIndex = -1;
            _isOrgImage = true;
            _leftObjs.length = 0, _rightObjs.length = 0;
            _leftSelected = true;
            objLeft = _sceneImageList[_leftIndex];
            imgSrcLeft = _isOrgImage ? objLeft.originImageUrl : objLeft.endImageUrl;
            if (imgSrcLeft !== null && imgSrcLeft !== undefined) {
                var image = new Image();
                image.crossOrigin = "Anonymous";
                image.src = imgSrcLeft;

                image.onload = function () {
                    EVEREXIF.getShoesSign(image, function () {
                        var shoesSignObj = this.shoesSign;
                        if (_isOrgImage) {
                            objLeft.originImageShoesSign = shoesSignObj;
                            _leftRate = 37.80 / (objLeft.originImageShoesSign == null ? 37.80 : objLeft.originImageShoesSign.scale);
                        } else {
                            objLeft.endImageShoesSign = shoesSignObj;
                            _leftRate = 37.80 / (objLeft.endImageShoesSign == null ? 37.80 : objLeft.endImageShoesSign.scale);
                        }
                        _sceneImageList[_leftIndex] = objLeft;
                        _canvasCompare.remove(_leftImageObj);
                        _canvasCompare.remove(_leftRotateObj);
                        _leftImageObj = new fabric.Image(this, {
                            scaleX: _leftRate,
                            scaleY: _leftRate,
                            left: _canvasCompare.width / 4,
                            top: _canvasCompare.height / 2,
                            evented: false,
                            selectable: false,
                            selection: false,
                            hasControls: false,
                            hasBorders: false,
                            padding: 0,
                            originX: 'center',
                            originY: 'center',
                            stroke: _leftSelected ? _leftSelectedColor : Transparent,
                            strokeWidth: _leftSelected ? _selectedSize : 0
                        });
                        _leftRotateObj = new RotateImage({
                            left: _canvasCompare.width / 4,
                            top: _canvasCompare.height / 2 - _leftImageObj.height * _leftRate / 2 - 100,
                            radius: 10,
                            fill: 'yellow',
                            evented: false,
                            selectable: false,
                            selection: false,
                            hasControls: false,
                            hasBorders: false,
                            padding: 0,
                            originX: 'center',
                            originY: 'center',
                            visible: _leftSelected
                        });
                        _canvasCompare.add(_leftImageObj, _leftRotateObj).renderAll();
                        _adaptiveSize();
                    });
                };

                image.onerror = function () {
                    image.crossOrigin = null;
                    image.src = '../img/no_image.jpg';
                };
            }
        } else if (_sceneImageList.length > 1) {
            _leftIndex = 0, _rightIndex = rightIndex ? rightIndex : 1;
            _isOrgImage = true;
            _leftObjs.length = 0, _rightObjs.length = 0;
            _leftSelected = true;
            objLeft = _sceneImageList[_leftIndex];
            imgSrcLeft = _isOrgImage ? objLeft.originImageUrl : objLeft.endImageUrl;
            if (imgSrcLeft !== null && imgSrcLeft !== undefined) {
                var image = new Image();
                image.crossOrigin = "Anonymous";
                image.src = imgSrcLeft;

                image.onload = function () {
                    EVEREXIF.getShoesSign(image, function () {
                        var shoesSignObj = this.shoesSign;
                        if (_isOrgImage) {
                            objLeft.originImageShoesSign = shoesSignObj;
                            _leftRate = 37.80 / (objLeft.originImageShoesSign == null ? 37.80 : objLeft.originImageShoesSign.scale);
                        } else {
                            objLeft.endImageShoesSign = shoesSignObj;
                            _leftRate = 37.80 / (objLeft.endImageShoesSign == null ? 37.80 : objLeft.endImageShoesSign.scale);
                        }
                        _sceneImageList[_leftIndex] = objLeft;
                        _canvasCompare.remove(_leftImageObj);
                        _canvasCompare.remove(_leftRotateObj);
                        _leftImageObj = new fabric.Image(this, {
                            scaleX: _leftRate,
                            scaleY: _leftRate,
                            left: _canvasCompare.width / 4,
                            top: _canvasCompare.height / 2,
                            evented: false,
                            selectable: false,
                            selection: false,
                            hasControls: false,
                            hasBorders: false,
                            padding: 0,
                            originX: 'center',
                            originY: 'center',
                            stroke: _leftSelected ? _leftSelectedColor : Transparent,
                            strokeWidth: _leftSelected ? _selectedSize : 0
                        });
                        _leftRotateObj = new RotateImage({
                            left: _canvasCompare.width / 4,
                            top: _canvasCompare.height / 2 - _leftImageObj.height * _leftRate / 2 - 100,
                            radius: 10,
                            fill: 'yellow',
                            evented: false,
                            selectable: false,
                            selection: false,
                            hasControls: false,
                            hasBorders: false,
                            padding: 0,
                            originX: 'center',
                            originY: 'center',
                            visible: _leftSelected
                        });
                        _canvasCompare.add(_leftImageObj, _leftRotateObj).renderAll();
                        _adaptiveSize();
                    });
                };

                image.onerror = function () {
                    image.crossOrigin = null;
                    image.src = '../img/no_image.jpg';
                };
            }
            objRight = _sceneImageList[_rightIndex];
            imgSrcRight = _isOrgImage ? objRight.originImageUrl : objRight.endImageUrl;
            if (imgSrcRight !== null && imgSrcRight !== undefined) {
                var imageRight = new Image();
                imageRight.crossOrigin = "Anonymous";
                imageRight.src = imgSrcRight;
                imageRight.onload = function () {
                    EVEREXIF.getShoesSign(imageRight, function () {
                        if (_isOrgImage) {
                            objRight.originImageShoesSign = this.shoesSign;
                            _rightRate = 37.80 / (objRight.originImageShoesSign == null ? 37.80 : objRight.originImageShoesSign.scale);
                        } else {
                            objRight.endImageShoesSign = this.shoesSign;
                            if (objRight.endImageShoesSign)
                                objRight.endImageShoesSign.scale = 37.80;
                            _rightRate = 37.80 / (objRight.endImageShoesSign == null ? 37.80 : objRight.endImageShoesSign.scale);
                        }
                        _sceneImageList[_rightIndex] = objRight;
                        _rightImageObj = new fabric.Image(this, {
                            scaleX: _rightRate,
                            scaleY: _rightRate,
                            left: _canvasCompare.width * 3 / 4,
                            top: _canvasCompare.height / 2,
                            evented: false,
                            selectable: false,
                            selection: false,
                            hasControls: false,
                            hasBorders: false,
                            padding: 0,
                            originX: 'center',
                            originY: 'center',
                            stroke: _leftSelected ? Transparent : _rightSelectedColor,
                            strokeWidth: _leftSelected ? 0 : _selectedSize
                        });
                        _rightRotateObj = new RotateImage({
                            left: _canvasCompare.width * 3 / 4,
                            top: _canvasCompare.height / 2 - _rightImageObj.height * _rightRate / 2 - 100,
                            radius: 10,
                            fill: 'yellow',
                            evented: false,
                            selectable: false,
                            selection: false,
                            hasControls: false,
                            hasBorders: false,
                            padding: 0,
                            originX: 'center',
                            originY: 'center',
                            visible: !_leftSelected
                        });
                        _canvasCompare.add(_rightImageObj, _rightRotateObj).renderAll();
                        _adaptiveSize();
                    });
                };
                imageRight.onerror = function () {
                    imageRight.crossOrigin = null;
                    imageRight.src = '../img/no_image.jpg';
                };
            }
        }
    }

    function _originSize(){
        if (_leftImageObj && _rightImageObj ) {
            var tlLeft, trLeft, brLeft, blLeft, tlRight, trRight, brRight, blRight;
            tlLeft = fabric.util.rotatePoint(new fabric.Point(_leftImageObj.left - _leftImageObj.width * _leftImageObj.scaleX / 2, _leftImageObj.top - _leftImageObj.height * _leftImageObj.scaleY / 2), _leftImageObj.getCenterPoint(), _leftImageObj.angle / 180 * Math.PI);
            trLeft = fabric.util.rotatePoint(new fabric.Point(_leftImageObj.left + _leftImageObj.width * _leftImageObj.scaleX / 2, _leftImageObj.top - _leftImageObj.height * _leftImageObj.scaleY / 2), _leftImageObj.getCenterPoint(), _leftImageObj.angle / 180 * Math.PI);
            brLeft = fabric.util.rotatePoint(new fabric.Point(_leftImageObj.left + _leftImageObj.width * _leftImageObj.scaleX / 2, _leftImageObj.top + _leftImageObj.height * _leftImageObj.scaleY / 2), _leftImageObj.getCenterPoint(), _leftImageObj.angle / 180 * Math.PI);
            blLeft = fabric.util.rotatePoint(new fabric.Point(_leftImageObj.left - _leftImageObj.width * _leftImageObj.scaleX / 2, _leftImageObj.top + _leftImageObj.height * _leftImageObj.scaleY / 2), _leftImageObj.getCenterPoint(), _leftImageObj.angle / 180 * Math.PI);
            tlRight = fabric.util.rotatePoint(new fabric.Point(_rightImageObj.left - _rightImageObj.width * _rightImageObj.scaleX / 2, _rightImageObj.top - _rightImageObj.height * _rightImageObj.scaleY / 2), _rightImageObj.getCenterPoint(), _rightImageObj.angle / 180 * Math.PI);
            trRight = fabric.util.rotatePoint(new fabric.Point(_rightImageObj.left + _rightImageObj.width * _rightImageObj.scaleX / 2, _rightImageObj.top - _rightImageObj.height * _rightImageObj.scaleY / 2), _rightImageObj.getCenterPoint(), _rightImageObj.angle / 180 * Math.PI);
            brRight = fabric.util.rotatePoint(new fabric.Point(_rightImageObj.left + _rightImageObj.width * _rightImageObj.scaleX / 2, _rightImageObj.top + _rightImageObj.height * _rightImageObj.scaleY / 2), _rightImageObj.getCenterPoint(), _rightImageObj.angle / 180 * Math.PI);
            blRight = fabric.util.rotatePoint(new fabric.Point(_rightImageObj.left - _rightImageObj.width * _rightImageObj.scaleX / 2, _rightImageObj.top + _rightImageObj.height * _rightImageObj.scaleY / 2), _rightImageObj.getCenterPoint(), _rightImageObj.angle / 180 * Math.PI);

            var points = [];
            points.push(trLeft);
            points.push(brLeft);
            points.push(blLeft);
            points.push(tlRight);
            points.push(trRight);
            points.push(brRight);
            points.push(blRight);
            var minX = tlLeft.x, maxX = tlLeft.x, minY = tlLeft.y, maxY = tlLeft.y;
            points.forEach(function (item) {
                minX = Math.min(minX, item.x),
                maxX = Math.max(maxX, item.x),
                minY = Math.min(minY, item.y),
                maxY = Math.max(maxY, item.y);
            });
            var center = new fabric.Point((_leftImageObj.getCenterPoint().x + _rightImageObj.getCenterPoint().x) / 2, (_leftImageObj.getCenterPoint().y + _rightImageObj.getCenterPoint().y) / 2);
            _zoomObject.currentLevel = 1;
            _canvasCompare.setViewportTransform([1, 0, 0, 1, 0, 0]);
            _canvasCompare.forEachObject(function (obj) { obj.set({ left: obj.left + _canvasCompare.getCenter().left - center.x, top: obj.top + _canvasCompare.getCenter().top - center.y }); });
            _canvasCompare.renderAll();
            _zoomObject.percent = 100;
            _zoomChangeListener(_zoomObject);
        }
    }

    function _adaptiveSize() {
       
        if (_leftImageObj && _rightImageObj ) {
            var tlLeft, trLeft, brLeft, blLeft, tlRight, trRight, brRight, blRight;
            tlLeft = fabric.util.rotatePoint(new fabric.Point(_leftImageObj.left - _leftImageObj.width * _leftImageObj.scaleX / 2, _leftImageObj.top - _leftImageObj.height * _leftImageObj.scaleY / 2), _leftImageObj.getCenterPoint(), _leftImageObj.angle / 180 * Math.PI);
            trLeft = fabric.util.rotatePoint(new fabric.Point(_leftImageObj.left + _leftImageObj.width * _leftImageObj.scaleX / 2, _leftImageObj.top - _leftImageObj.height * _leftImageObj.scaleY / 2), _leftImageObj.getCenterPoint(), _leftImageObj.angle / 180 * Math.PI);
            brLeft = fabric.util.rotatePoint(new fabric.Point(_leftImageObj.left + _leftImageObj.width * _leftImageObj.scaleX / 2, _leftImageObj.top + _leftImageObj.height * _leftImageObj.scaleY / 2), _leftImageObj.getCenterPoint(), _leftImageObj.angle / 180 * Math.PI);
            blLeft = fabric.util.rotatePoint(new fabric.Point(_leftImageObj.left - _leftImageObj.width * _leftImageObj.scaleX / 2, _leftImageObj.top + _leftImageObj.height * _leftImageObj.scaleY / 2), _leftImageObj.getCenterPoint(), _leftImageObj.angle / 180 * Math.PI);
            tlRight = fabric.util.rotatePoint(new fabric.Point(_rightImageObj.left - _rightImageObj.width * _rightImageObj.scaleX / 2, _rightImageObj.top - _rightImageObj.height * _rightImageObj.scaleY / 2), _rightImageObj.getCenterPoint(), _rightImageObj.angle / 180 * Math.PI);
            trRight = fabric.util.rotatePoint(new fabric.Point(_rightImageObj.left + _rightImageObj.width * _rightImageObj.scaleX / 2, _rightImageObj.top - _rightImageObj.height * _rightImageObj.scaleY / 2), _rightImageObj.getCenterPoint(), _rightImageObj.angle / 180 * Math.PI);
            brRight = fabric.util.rotatePoint(new fabric.Point(_rightImageObj.left + _rightImageObj.width * _rightImageObj.scaleX / 2, _rightImageObj.top + _rightImageObj.height * _rightImageObj.scaleY / 2), _rightImageObj.getCenterPoint(), _rightImageObj.angle / 180 * Math.PI);
            blRight = fabric.util.rotatePoint(new fabric.Point(_rightImageObj.left - _rightImageObj.width * _rightImageObj.scaleX / 2, _rightImageObj.top + _rightImageObj.height * _rightImageObj.scaleY / 2), _rightImageObj.getCenterPoint(), _rightImageObj.angle / 180 * Math.PI);

            var points = [];
            points.push(trLeft);
            points.push(brLeft);
            points.push(blLeft);
            points.push(tlRight);
            points.push(trRight);
            points.push(brRight);
            points.push(blRight);
            var minX = tlLeft.x, maxX = tlLeft.x, minY = tlLeft.y, maxY = tlLeft.y;
            points.forEach(function (item) {
                minX = Math.min(minX, item.x),
                maxX = Math.max(maxX, item.x),
                minY = Math.min(minY, item.y),
                maxY = Math.max(maxY, item.y);
            });
            var width = maxX - minX, height = maxY - minY, center = new fabric.Point((_leftImageObj.getCenterPoint().x  + _rightImageObj.getCenterPoint().x) / 2, (_leftImageObj.getCenterPoint().y + _rightImageObj.getCenterPoint().y) / 2);
            var scaleTemp = Math.min(_canvasCompare.width / width, _canvasCompare.height / height);
            if(Math.round(Math.abs(_zoomObject.currentLevel-scaleTemp)*100) != 0){
                _zoomObject.currentLevel = scaleTemp;
                _zoomObject.percent = Math.round(_zoomObject.currentLevel * 100);
                _zoomChangeListener(_zoomObject);
            }
            
            var diffX = _canvasCompare.getCenter().left - center.x, diffY = _canvasCompare.getCenter().top - center.y;
            if(Math.round(diffX)+Math.round(diffY) != 0){
                _canvasCompare.forEachObject(function (obj) { obj.set({ left: obj.left + _canvasCompare.getCenter().left - center.x, top: obj.top + _canvasCompare.getCenter().top - center.y }); });
            }
            _canvasCompare.setViewportTransform([_zoomObject.currentLevel, 0, 0, _zoomObject.currentLevel, _canvasCompare.width*(1-_zoomObject.currentLevel)/2, _canvasCompare.height*(1-_zoomObject.currentLevel)/2]);
            _canvasCompare.renderAll();
            
        }
    }

    function _setLeftImage(index) {
        if (index < 0 || _sceneImageList === null || index > _sceneImageList.length - 1)
            return;
        _leftIndex = index;
        _leftSelected = true;
        var obj = _sceneImageList[index];
        var image = new Image();
        image.crossOrigin = "Anonymous";
        image.src = _isOrgImage ? obj.originImage : obj.endImage;
        image.onload = function () {
            if (_isOrgImage) {
                if (obj.originImageShoesSign) {
                    _leftRate = 37.80 / obj.originImageShoesSign.scale;
                    _drawFootImageCanvas(true, image);
                } else {
                    EVEREXIF.getShoesSign(image, function () {
                        obj.originImageShoesSign = this.shoesSign;
                        _leftRate = 37.80 / (obj.originImageShoesSign == null ? 37.80 : obj.originImageShoesSign.scale);
                        _sceneImageList[index] = obj;
                        _drawFootImageCanvas(true, this);
                    });
                }
            } else {
                if (obj.endImageShoesSign) {
                    _leftRate = 37.80 / obj.endImageShoesSign.scale;
                    _drawFootImageCanvas(true, image);
                } else {
                    EVEREXIF.getShoesSign(image, function () {
                        obj.endImageShoesSign = this.shoesSign;
                        if (obj.endImageShoesSign)
                            obj.endImageShoesSign.scale = 37.80;
                        _leftRate = 37.80 / (obj.endImageShoesSign == null ? 37.80 : obj.endImageShoesSign.scale);
                        _sceneImageList[index] = obj;
                        _drawFootImageCanvas(true, this);
                    });
                }
            }
        };

    }

    function _setRightImage(index) {
        if (index <= 0 || _sceneImageList === null || index > _sceneImageList.length - 1){
            _canvasCompare.remove(_rightImageObj);
            _canvasCompare.remove(_rightRotateObj);
            _rightObjs.forEach(function (objs) { objs.forEach(function (obj) { _canvasCompare.remove(obj); }); });
            _rightObjs.length = 0;
            _canvasCompare.renderAll();
            return;
        }
        
        _rightIndex = index;
        _leftSelected = false;
        var obj = _sceneImageList[index];
        var image = new Image();
        image.crossOrigin = "Anonymous";
        image.src = _isOrgImage ? obj.originImageUrl : obj.endImageUrl ? obj.endImageUrl : obj.originImageUrl;
        image.onload = function () {
            if (_isOrgImage) {
                if (obj.originImageShoesSign) {
                    _rightRate = 37.80 / obj.originImageShoesSign.scale;
                    _drawFootImageCanvas(false, image);
                } else {
                    EVEREXIF.getShoesSign(image, function () {
                        obj.originImageShoesSign = this.shoesSign;
                        _rightRate = 37.80 / (obj.originImageShoesSign == null ? 37.80 : obj.originImageShoesSign.scale);
                        _sceneImageList[index] = obj;
                        _drawFootImageCanvas(false, this);
                    });
                }
            } else {
                if (obj.endImageShoesSign) {
                    _rightRate = 37.80 / obj.endImageShoesSign.scale;
                    _drawFootImageCanvas(false, image);
                } else {
                    EVEREXIF.getShoesSign(image, function () {
                        obj.endImageShoesSign = this.shoesSign;
                        if (obj.endImageShoesSign)
                            obj.endImageShoesSign.scale = 37.80;
                        _rightRate = 37.80 / (obj.endImageShoesSign == null ? 37.80 : obj.endImageShoesSign.scale);
                        _sceneImageList[index] = obj;
                        _drawFootImageCanvas(false, this);
                    });
                }
            }
        };

        image.onerror = function () {
            image.crossOrigin = null;
            image.src = '../img/no_image.jpg';
        };
    }

    function _drawFootImageCanvas(isLeft, image) {
        _canvasCompare.remove(isLeft ? _leftImageObj : _rightImageObj);
        _canvasCompare.remove(isLeft ? _leftRotateObj : _rightRotateObj);
        if (isLeft) {
            _leftObjs.forEach(function (objs) { objs.forEach(function (obj) { _canvasCompare.remove(obj); }); });
            _leftObjs.length = 0;
            _leftImageObj = new fabric.Image(image, {
                scaleX: _leftRate,
                scaleY: _leftRate,
                left: _leftImageObj.left,
                top: _leftImageObj.top,
                evented: false,
                selectable: false,
                selection: false,
                hasControls: false,
                hasBorders: false,
                padding: 0,
                originX: 'center',
                originY: 'center',
                stroke: _leftSelectedColor,
                strokeWidth: _selectedSize
            });
            _leftRotateObj = new RotateImage({
                left: _leftImageObj.left,
                top: _leftImageObj.top - _leftImageObj.height * _leftRate / 2 - 100,
                radius: 10,
                fill: 'yellow',
                evented: false,
                selectable: false,
                selection: false,
                hasControls: false,
                hasBorders: false,
                padding: 0,
                originX: 'center',
                originY: 'center',
                visible: true
            });
            _rightImageObj.set({ stroke: Transparent, strokeWidth: 0 });
            _rightRotateObj.visible = false;
            _canvasCompare.add(_leftImageObj, _leftRotateObj).renderAll();
        } else {
            _rightObjs.forEach(function (objs) { objs.forEach(function (obj) { _canvasCompare.remove(obj); }); });
            _rightObjs.length = 0;
            _rightImageObj = new fabric.Image(image, {
                scaleX: _rightRate,
                scaleY: _rightRate,
                left: _rightImageObj.left,
                top: _rightImageObj.top,
                evented: false,
                selectable: false,
                selection: false,
                hasControls: false,
                hasBorders: false,
                padding: 0,
                originX: 'center',
                originY: 'center',
                stroke: _rightSelectedColor,
                strokeWidth: _selectedSize
            });
            _rightRotateObj = new RotateImage({
                left: _rightImageObj.left,
                top: _rightImageObj.top - _rightImageObj.height * _rightRate / 2 - 100,
                radius: 10,
                fill: 'yellow',
                evented: false,
                selectable: false,
                selection: false,
                hasControls: false,
                hasBorders: false,
                padding: 0,
                originX: 'center',
                originY: 'center',
                visible: true
            });
            _leftImageObj.set({ stroke: Transparent, strokeWidth: 0 });
            _leftRotateObj.visible = false;
            _canvasCompare.add(_rightImageObj, _rightRotateObj).renderAll();
        }
    }

    function _base64Img2Blob(code) {
        var parts = code.split(';base64,');
        var contentType = parts[0].split(':')[1];
        var raw = window.atob(parts[1]);
        var rawLength = raw.length;
        var uInt8Array = new Uint8Array(rawLength);
        for (var i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        return new Blob([uInt8Array], { type: contentType });
    };

    function _downloadFile(fileName, content) {
        var browerType = myBrowser();
        switch (browerType) {
            case 'IE':
                downloadInIE(fileName, content);
                break;
            default:
                defaultDownload(fileName, content, browerType == 'Firefox');
                break;
        }

    };

    function defaultDownload(fileName, content, isFirefox) {
        var aLink = document.createElement('a');
        var blob = _base64Img2Blob(content); //new Blob([content]);
        var evt = document.createEvent('HTMLEvents');
        evt.initEvent('click', true, true);//initEvent
        aLink.download = fileName;
        aLink.href = URL.createObjectURL(blob);
        if (isFirefox) {
            aLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        } else {
            aLink.click();
        }
    };

    function downloadInIE(fileName, content) {
        var bstr = atob(content.split(',')[1]);
        var n = bstr.length;
        var u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        var blob = new Blob([u8arr]);
        window.navigator.msSaveOrOpenBlob(blob, fileName);
    };

    function myBrowser() {
        var userAgent = navigator.userAgent; //userAgent
        var isOpera = userAgent.indexOf("Opera") > -1;
        if (isOpera) {
            return "Opera";
        }; //Opera
        if (userAgent.indexOf("Firefox") > -1) {
            return "Firefox";
        } //Firefox
        if (userAgent.indexOf("Chrome") > -1) {
            return "Chrome";
        }
        if (userAgent.indexOf("Safari") > -1) {
            return "Safari";
        } //Safari
        if (userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera) {
            return "IE";
        }; //IE
    };
    var Node = fabric.util.createClass(fabric.Rect, {
        type: 'node',
        initialize: function (options) {
            options || (options = {});
            options.width=10;
            options.height=10;
            options.fill= 'blue';
            options.evented= false;
            options.originX= 'center';
            options.originY= 'center';
            options.hoverCursor='pointer';
            this.callSuper('initialize', options);
        },
        toObject: function () {
            return fabric.util.object.extend(this.callSuper('toObject'));
        },
        _render: function (ctx) {
            this.callSuper('_render', ctx);
        }
    });

    var RotateImage = fabric.util.createClass(fabric.Circle, {
        type: 'rotate_image',
        initialize: function (options) {
            options || (options = {});
            this.callSuper('initialize', options);
        },
        toObject: function () {
            return fabric.util.object.extend(this.callSuper('toObject'));
        },
        _render: function (ctx) {
            this.callSuper('_render', ctx);
        }
    });

    var RotateSign = fabric.util.createClass(fabric.Circle, {
        type: 'rotate_sign',
        initialize: function (options) {
            options || (options = {});
            this.callSuper('initialize', options);
        },
        toObject: function () {
            return fabric.util.object.extend(this.callSuper('toObject'));
        },
        _render: function (ctx) {
            this.callSuper('_render', ctx);
        }
    });

    function _drawLeftImageTypeChange(image) {
        _canvasCompare.remove(_leftImageObj);
        _canvasCompare.remove(_leftRotateObj);
        _leftImageObj = new fabric.Image(image, {
            angle: _leftImageObj.angle,
            scaleX: _leftRate,
            scaleY: _leftRate,
            left: _leftImageObj.left,
            top: _leftImageObj.top,
            evented: false,
            selectable: false,
            selection: false,
            hasControls: false,
            hasBorders: false,
            padding: 0,
            originX: 'center',
            originY: 'center',
            stroke: _leftSelected ? _leftSelectedColor : Transparent,
            strokeWidth: _leftSelected ? _selectedSize : 0
        });
        var pointLeft = new fabric.Point(_leftImageObj.left, _leftImageObj.top - _leftImageObj.height * _leftRate / 2 - 100);
        pointLeft = fabric.util.rotatePoint(pointLeft, _leftImageObj.getCenterPoint(), _leftImageObj.angle / 180 * Math.PI);
        _leftRotateObj = new RotateImage({
            left: pointLeft.x,
            top: pointLeft.y,
            radius: 10,
            fill: 'yellow',
            evented: false,
            selectable: false,
            selection: false,
            hasControls: false,
            hasBorders: false,
            padding: 0,
            originX: 'center',
            originY: 'center',
            visible: _leftSelected
        });
        _canvasCompare.add(_leftImageObj, _leftRotateObj).renderAll();
    };

    function _drawRightImageTypeChange(image) {
        _canvasCompare.remove(_rightImageObj);
        _canvasCompare.remove(_rightRotateObj);
        _rightImageObj = new fabric.Image(image, {
            angle: _rightImageObj.angle,
            scaleX: _rightRate,
            scaleY: _rightRate,
            left: _rightImageObj.left,
            top: _rightImageObj.top,
            evented: false,
            selectable: false,
            selection: false,
            hasControls: false,
            hasBorders: false,
            padding: 0,
            originX: 'center',
            originY: 'center',
            stroke: _leftSelected ? Transparent : _rightSelectedColor,
            strokeWidth: _leftSelected ? 0 : _selectedSize
        });
        var pointRight = new fabric.Point(_rightImageObj.left, _rightImageObj.top - _rightImageObj.height * _rightRate / 2 - 100);
        pointRight = fabric.util.rotatePoint(pointRight, _rightImageObj.getCenterPoint(), _rightImageObj.angle / 180 * Math.PI);
        _rightRotateObj = new RotateImage({
            left: pointRight.x,
            top: pointRight.y,
            radius: 10,
            fill: 'yellow',
            evented: false,
            selectable: false,
            selection: false,
            hasControls: false,
            hasBorders: false,
            padding: 0,
            originX: 'center',
            originY: 'center',
            visible: !_leftSelected
        });
        _canvasCompare.add(_rightImageObj, _rightRotateObj).renderAll();
    };


    return function (canvasId, canvasParentId, zoomChangeCallback, signSelecteCallback, scaleInputCallback) {
        _init(canvasId, canvasParentId, zoomChangeCallback, signSelecteCallback, scaleInputCallback);
        this.setBackgroundColor = function (color) {
            _canvasCompare.set({ backgroundColor: color }).renderAll();
        };
        this.save = function () {
            _downloadFile("compare.jpg", _canvasCompare.toDataURL({ format: 'jpeg', quality: 1 }));
        };
        this.setScaleDraw = function () {
            _currentDrawType = 'scale';
        };
        this.setSignClass = function (shape, color, size, isFill, isClose, isMeasure, lineType, isSolid) {
            var signClass = _getSignClassWithShape(shape);
            if (signClass) {
                if (color !== undefined) {
                    signClass.color = color;
                }
                if (size !== undefined) {
                    signClass.size = size;
                }
                if (isFill !== undefined) {
                    signClass.isFill = isFill;
                }
                if (isClose !== undefined) {
                    signClass.isClose = isClose;
                }
                if (isMeasure !== undefined) {
                    signClass.isMeasure = isMeasure;
                }
                if (lineType !== undefined) {
                    signClass.lineType = lineType;
                }
                if (isSolid !== undefined) {
                    signClass.isSolid = isSolid;
                }
                if (_selecteSignObjIndex !== -1) {
                    var group = _leftSelected ? _leftObjs[_selecteSignObjIndex] : _rightObjs[_selecteSignObjIndex], textObj = group[1], res = null, signObj = group[0];
                    if ('sign_' + signObj.tag.type === shape) {
                        switch (signObj.tag.type) {
                            case 'line':
                                var startPointObj = group[3], endPointObj = group[4];
                                signObj.tag.lineType = signClass.lineType;
                                res = _createLineTypePath(signObj.tag.lineType, [startPointObj.getCenterPoint(), endPointObj.getCenterPoint()], false);
                                _canvasCompare.remove(signObj);
                                group[0] = new fabric.Path(res.path, {
                                    left: res.center.x,
                                    top: res.center.y,
                                    stroke: signClass.color,
                                    strokeWidth: signClass.size,
                                    strokeDashArray: signClass.isSolid ? null : [5, 5],
                                    fill: signClass.isFill ? signClass.color : Transparent,
                                    evented: false,
                                    selectable: false,
                                    selection: false,
                                    hasControls: false,
                                    hasBorders: false,
                                    padding: 0,
                                    originX: 'center',
                                    originY: 'center'
                                });
                                group[0].tag = signObj.tag;
                                _canvasCompare.add(group[0]);
                                group[0].moveTo(_canvasCompare.getObjects().length - group.length);
                                textObj.visible = signClass.isMeasure;
                                break;
                            case 'rect':
                            case 'ellipse':
                                signObj.tag.lineType = signClass.lineType;
                                signObj.set({ stroke: signClass.color, strokeWidth: signClass.size, fill: signClass.isFill ? signClass.color : Transparent, strokeDashArray: signClass.isSolid ? null : [5, 5] });
                                textObj.visible = signClass.isMeasure;
                                break;
                            case 'polygon':
                                signObj.tag.lineType = signClass.lineType;
                                var points = [];
                                for (var i = 3; i < group.length; i++) {
                                    points.push(group[i].getCenterPoint());
                                }
                                res = _createLineTypePath(signObj.tag.lineType, points, signClass.isClose);
                                _canvasCompare.remove(signObj);
                                group[0] = new fabric.Path(
                                    res.path,
                                    {
                                        left: res.center.x,
                                        top: res.center.y,
                                        originX: 'center',
                                        originY: 'center',
                                        fill: signClass.isFill ? signClass.color : Transparent,
                                        stroke: signClass.color,
                                        strokeWidth: signClass.size,
                                        strokeDashArray: signClass.isSolid ? null : [5, 5],
                                        evented: false,
                                        selectable: false,
                                        selection: false,
                                        hasControls: false,
                                        hasBorders: false,
                                        padding: 0
                                    });
                                group[0].tag = signObj.tag;
                                _canvasCompare.add(group[0]);
                                group[0].moveTo(_canvasCompare.getObjects().length - group.length);
                                textObj.visible = signClass.isMeasure;
                                break;
                        }
                        _canvasCompare.renderAll();
                    }
                }
            }
        };
        this.transSub = function () {
            _opacity -= 0.01;
            _intersectRectJudge();
            _canvasCompare.renderAll();
        };
        this.transAdd = function () {
            _opacity += 0.01;
            _intersectRectJudge();
            _canvasCompare.renderAll();
        };
        this.setTransValue = function (value) {
            _opacity = 1.0 - value;
            _intersectRectJudge();
            _canvasCompare.renderAll();
        };
        this.zoomSub = function () {
            var point = _canvasCompare.getCenter();
            _zoom(-20, point.left, point.top);
        };
        this.zoomAdd = function () {
            var point = _canvasCompare.getCenter();
            _zoom(20, point.left, point.top);
        };
        this.setZoomPercent = function (percent) {
            var newLevel = percent / 100;
            if (_zoomObject.currentLevel == newLevel)
                return;
            _zoomObject.currentLevel = newLevel;
            _zoomObject.percent = percent;
            var point = new fabric.Point(_canvasCompare.getCenter().left, _canvasCompare.getCenter().top);
            _canvasCompare.zoomToPoint(point, _zoomObject.currentLevel);
            _canvasCompare.renderAll();
            //_zoomChangeListener(_zoomObject);
        };
        this.previous = function () {
            if (_rightIndex == 0) {
                return;
            }
            _rightIndex--;
            _setRightImage(_rightIndex);
        };
        this.next = function () {
            if (_rightIndex == _sceneImageList.length - 1) {
                return;
            }
            _rightIndex++;
            _setRightImage(_rightIndex);
        };

        this.setRightImageIndex = function(index){
            if(index<0 || index>_sceneImageList.length - 1){
                return;
            }
            _rightIndex = index;
            _setRightImage(_rightIndex);
        }

        this.setLeft = function () {
            if (_leftSelected === null || _leftSelected === true)
                return;
            _leftSelected = true;
            var temp = _rightImageObj;
            _rightImageObj = _leftImageObj;
            _leftImageObj = temp;

            temp = _rightRotateObj;
            _rightRotateObj = _leftRotateObj;
            _leftRotateObj = temp;


            _leftImageObj.set({
                stroke: _leftSelected ? _leftSelectedColor : Transparent,
                strokeWidth: _leftSelected ? _selectedSize : 0
            });
            _leftRotateObj.set({ visible: _leftSelected });
            _rightImageObj.set({
                stroke: _leftSelected ? Transparent : _rightSelectedColor,
                strokeWidth: _leftSelected ? 0 : _selectedSize
            });
            _rightRotateObj.set({ visible: !_leftSelected });
            _rightImageObj.moveTo(0);
            _rightRotateObj.moveTo(1);
            _leftImageObj.moveTo(2);
            _leftRotateObj.moveTo(3);
            _canvasCompare.renderAll();


            temp = _rightObjs;
            _rightObjs = _leftObjs;
            _leftObjs = temp;
            _rightObjs.forEach(function (group) { group.forEach(function (obj) { obj.tag.isLeftSelected = false; }); });
            _leftObjs.forEach(function (group) { group.forEach(function (obj) { obj.tag.isLeftSelected = true; }); });
            temp = _rightRate;
            _rightRate = _leftRate;
            _leftRate = temp;

            temp = _rightIndex;
            _rightIndex = _leftIndex;
            _leftIndex = temp;

        };
        this.setSignShapeDrawType = function (type) {
            _currentDrawType = type;
            if (_signCallback && typeof _signCallback == 'function') {
                _signCallback(_getSignClassWithShape(type));
            }
        };
        this.horizontalFlip = function () {
            if (_leftSelected) {
                _leftImageObj.set({ flipX: !_leftImageObj.flipX });
            } else {
                _rightImageObj.set({ flipX: !_rightImageObj.flipX });
            }
            _canvasCompare.renderAll();
        };
        this.verticalFlip = function () {
            if (_leftSelected) {
                _leftImageObj.set({ flipY: !_leftImageObj.flipY });
            } else {
                _rightImageObj.set({ flipY: !_rightImageObj.flipY });
            }
            _canvasCompare.renderAll();
        };
        this.changeImageType = function () {
            _isOrgImage = !_isOrgImage;
            var objLeft = _sceneImageList[_leftIndex];
            var imgSrc = _isOrgImage ? objLeft.originImageUrl : objLeft.endImageUrl;
            if (imgSrc !== null && imgSrc !== undefined) {
                var imageLeft = new Image();
                imageLeft.crossOrigin = "Anonymous";
                imageLeft.src = imgSrc;
                imageLeft.onload = function () {
                    if (_isOrgImage) {
                        if (objLeft.originImageShoesSign) {
                            _leftRate = 37.80 / objLeft.originImageShoesSign.scale;
                            _drawLeftImageTypeChange(imageLeft);
                        } else {
                            EVEREXIF.getShoesSign(imageLeft, function () {
                                objLeft.originImageShoesSign = this.shoesSign;
                                _leftRate = 37.80 / (objLeft.originImageShoesSign == null ? 37.80 : objLeft.originImageShoesSign.scale);
                                _sceneImageList[_leftIndex] = objLeft;
                                _drawLeftImageTypeChange(imageLeft);
                            });
                        }
                    } else {
                        if (objLeft.endImageShoesSign) {
                            _leftRate = 37.80 / objLeft.endImageShoesSign.scale;
                            _drawLeftImageTypeChange(imageLeft);
                        } else {
                            EVEREXIF.getShoesSign(imageLeft, function () {
                                objLeft.endImageShoesSign = this.shoesSign;
                                if (objLeft.endImageShoesSign)
                                    objLeft.endImageShoesSign.scale = 37.80;
                                _leftRate = 37.80 / (objLeft.endImageShoesSign == null ? 37.80 : objLeft.endImageShoesSign.scale);
                                _sceneImageList[_leftIndex] = objLeft;
                                _drawLeftImageTypeChange(imageLeft);
                            });
                        }
                    }
                };
            }
            var objRight = _sceneImageList[_rightIndex];
            imgSrc = _isOrgImage ? objRight.originImageUrl : objRight.endImageUrl;
            if (imgSrc !== null && imgSrc !== undefined) {
                var imageRight = new Image();
                imageRight.crossOrigin = "Anonymous";
                imageRight.src = imgSrc;
                imageRight.onload = function () {
                    if (_isOrgImage) {
                        if (objRight.originImageShoesSign) {
                            _rightRate = 37.80 / objRight.originImageShoesSign.scale;
                            _drawRightImageTypeChange(imageRight);
                        } else {
                            EVEREXIF.getShoesSign(imageRight, function () {
                                objRight.originImageShoesSign = this.shoesSign;
                                _rightRate = 37.80 / (objRight.originImageShoesSign == null ? 37.80 : objRight.originImageShoesSign.scale);
                                _sceneImageList[_rightIndex] = objRight;
                                _drawRightImageTypeChange(imageRight);
                            });
                        }
                    } else {
                        if (objRight.endImageShoesSign) {
                            _rightRate = 37.80 / objRight.endImageShoesSign.scale;
                            _drawRightImageTypeChange(imageRight);
                        } else {
                            EVEREXIF.getShoesSign(imageRight, function () {
                                objRight.endImageShoesSign = this.shoesSign;
                                if (objRight.endImageShoesSign)
                                    objRight.endImageShoesSign.scale = 37.80;
                                _rightRate = 37.80 / (objRight.endImageShoesSign == null ? 37.80 : objRight.endImageShoesSign.scale);
                                _sceneImageList[_rightIndex] = objRight;
                                _drawRightImageTypeChange(imageRight);
                            });
                        }
                    }
                };
            }
        };
        this.initImage = function (sceneImageList, rightIndex) {
            _initImage(sceneImageList, rightIndex);
        };
        this.setEmptyDrawType = function () {
            _currentDrawType = '';
        };
        this.setScaleValue = function (value) {
            var length = _get2PonitLength(new fabric.Point(_scaleObj.x1, _scaleObj.y1), new fabric.Point(_scaleObj.x2, _scaleObj.y2));
            var scaleRate = value * 96 / length / 2.54;
            var point;
            if (_leftSelected) {
                if (_leftObjs.length > 0) {
                    _canvasCompare.forEachObject(
                        function (obj) {
                            if (_leftObjs.concat(obj)) {
                                _canvasCompare.remove(obj);
                            }
                        }
                    );
                    _leftObjs.length = 0;
                }
                _leftRate *= scaleRate;
                if (_isOrgImage) {
                    _sceneImageList[_leftIndex].originImageShoesSign ? _sceneImageList[_leftIndex].originImageShoesSign.scale = 96 / 2.54 / _leftRate : _sceneImageList[_leftIndex].originImageShoesSign = { scale: 96 / 2.54 / _leftRate};
                } else {
                    _sceneImageList[_leftIndex].endImageShoesSign ? _sceneImageList[_leftIndex].endImageShoesSign.scale = 96 / 2.54 / _leftRate : _sceneImageList[_leftIndex].endImageShoesSign = { scale: 96 / 2.54 / _leftRate };
                }
                _leftImageObj.set({ scaleX: _leftRate, scaleY: _leftRate });
                point = new fabric.Point(_leftImageObj.getCenterPoint().x, _leftImageObj.getCenterPoint().y - _leftImageObj.height * _leftRate / 2 - 100);
                point = fabric.util.rotatePoint(point, _leftImageObj.getCenterPoint(), _leftImageObj.angle / 180 * Math.PI);
                _leftRotateObj.set({ left: point.x, top: point.y });
            } else {
                if (_rightObjs.length > 0) {
                    _canvasCompare.forEachObject(
                        function (obj) {
                            if (_rightObjs.concat(obj)) {
                                _canvasCompare.remove(obj);
                            }
                        }
                    );
                    _rightObjs.length = 0;
                }
                _rightRate *= scaleRate;
                if (_isOrgImage) {
                    _sceneImageList[_rightIndex].originImageShoesSign ? _sceneImageList[_rightIndex].originImageShoesSign.scale = 96 / 2.54 / _rightRate : _sceneImageList[_rightIndex].originImageShoesSign = { scale: 96 / 2.54 / _rightRate };
                } else {
                    _sceneImageList[_rightIndex].endImageShoesSign ? _sceneImageList[_rightIndex].endImageShoesSign.scale = 96 / 2.54 / _rightRate : _sceneImageList[_rightIndex].endImageShoesSign = { scale: 96 / 2.54 / _rightRate };
                }
                _rightImageObj.set({ scaleX: _rightRate, scaleY: _rightRate });
                point = new fabric.Point(_rightImageObj.getCenterPoint().x, _rightImageObj.getCenterPoint().y - _rightImageObj.height * _rightRate / 2 - 100);
                point = fabric.util.rotatePoint(point, _rightImageObj.getCenterPoint(), _rightImageObj.angle / 180 * Math.PI);
                _rightRotateObj.set({ left: point.x, top: point.y });
            }
            _canvasCompare.remove(_scaleObj);
            _canvasCompare.renderAll();
            _scaleObj = null;
        };
        this.setScaleCancel = function () {
            _canvasCompare.remove(_scaleObj).renderAll();
            _scaleObj = null;
        };
        this.originSize = function () {
            _originSize();
        };
        this.adaptiveSize = function () {
            _adaptiveSize();
        };
        this.deleteSign = function () {
            if (_selecteSignObjIndex !== -1) {
                var group = _leftSelected ? _leftObjs[_selecteSignObjIndex] : _rightObjs[_selecteSignObjIndex], signObj = group[0], temp;
                group.forEach(function (obj) { _canvasCompare.remove(obj); });
                _canvasCompare.renderAll();
                if (signObj.tag.isLeftSelected) {
                    temp = _leftObjs;
                    _leftObjs = null;
                    _leftObjs = [];
                    temp.forEach(function (temp, index) { if (index !== _selecteSignObjIndex) { _leftObjs.push(temp); } });
                } else {
                    temp = _rightObjs;
                    _rightObjs = null;
                    _rightObjs = [];
                    temp.forEach(function (temp, index) { if (index !== _selecteSignObjIndex) { _rightObjs.push(temp); } });
                }
            }
        };
        this.getCurrentRightIndex = function () { return _rightIndex; };
        this.removeCompareData = function (start, count, rightIndex) {
            _sceneImageList.splice(start, count);
            _setRightImage(rightIndex);
        };
    };
}
export default Compare