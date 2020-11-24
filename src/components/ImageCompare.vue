<template>
    <div class="con">
        <div :class="secondType == ''? 'left-menu': 'left-menu active'" id="leftMenu">
            <div class="default">
                <ul id="toolsul" class="tools">
                    <li>
                        <span title="保存" @click="save();" class="icon iconfont">&#xe6bd;</span>
                    </li>
                    <li :class="type == 'scale'? 'active': ''">
                        <span title="比例尺" :class="'icon iconfont'" @click="type = 'scale';setScaleDraw();">&#xe6c1;</span>
                    </li>
                    <li :class="type == 'backgroundColor'? 'active': ''">
                        <span title="背景色" @click="type='backgroundColor'; secondType = secondType == type ? '' : 'backgroundColor';" class="icon iconfont">&#xe949;</span>
                    </li>
                    <li :class="type == 'sign'? 'active': ''">
                        <span title="标画特征" :class="type == 'sign'? 'icon iconfont active': 'icon iconfont'" @click="type='sign';secondType = secondType == type ? '' : 'sign'; setSignShapeDrawType(sign.shape);">&#xe745;</span>
                    </li>
                </ul>
            </div>
            <div class="extend" id="extend" v-show="secondType != ''">
                <div id="regionSelect" class="tools-items" v-show="secondType=='backgroundColor'">
                    <p>背景色</p>
                    <div class="item-box-full">
                        <span @click="setBackgroundColor('white')" :class=" background == 'white'? 'active': ''" class="icon iconfont white">&#xe854;</span>
                        <span @click="setBackgroundColor('black')" :class=" background == 'black'? 'active': ''" class="icon iconfont black">&#xe854;</span>
                        <span @click="setBackgroundColor('yellow')" :class=" background == 'yellow'? 'active': ''" class="icon iconfont yellow">&#xe854;</span>
                        <span @click="setBackgroundColor('green')" :class=" background == 'green'? 'active': ''" class="icon iconfont green">&#xe854;</span>
                        <span @click="setBackgroundColor('orange')" :class=" background == 'orange'? 'active': ''" class="icon iconfont orange">&#xe854;</span>
                        <span @click="setBackgroundColor('red')" :class=" background == 'red'? 'active': ''" class="icon iconfont red">&#xe854;</span>
                    </div>
                </div>
                <div class="tools-items" v-show="secondType=='sign'" id="drawSpic">
                    <p>标画特征</p>
                    <p>形状 <span class="icon iconfont abs-right" @click="deleteSign()">&#xe6dc;</span></p>
                    <div class="item-items">
                        <p @click="setSignShapeDrawType('sign_polygon');sign.shape = 'sign_polygon';" :class="sign.shape == 'sign_polygon'? 'active': ''"><span class="icon iconfont">&#xe8d3;</span>折线</p>
                        <p @click="setSignShapeDrawType('sign_line');sign.shape = 'sign_line';" :class="sign.shape == 'sign_line'? 'active': ''"><span class="icon iconfont">&#xe8e0;</span>直线</p>
                        <p @click="setSignShapeDrawType('sign_ellipse');sign.shape = 'sign_ellipse';" :class="sign.shape == 'sign_ellipse'? 'active': ''"><span class="icon iconfont">&#xe8e2;</span>圆形</p>
                        <p @click="setSignShapeDrawType('sign_rect');sign.shape = 'sign_rect';" :class="sign.shape == 'sign_rect'? 'active': ''"><span class="icon iconfont">&#xe8e1;</span>方形</p>
                    </div>
                    <p>颜色</p>
                    <div class="item-items">
                        <div class="color-select">
                            <span @click="sign.color = 'white'" :class="sign.color == 'white' ? 'active': ''">正色</span>
                            <span @click="sign.color = 'black'" :class="sign.color == 'black' ? 'active': ''">反色</span>
                        </div>
                    </div>
                    <p>大小</p>
                    <div class="item-items">
                        <el-slider v-model="sign.size.value" :min="sign.size.min" :max="sign.size.max"></el-slider>
                    </div>
                    <p>属性 <span class="icon iconfont guged-btn abs-right" @click="secondType='gauged'">&#xe6d4;</span></p>
                    <div class="item-items">
                        <p><label>测量</label><input type="checkbox" v-model="sign.isMeasure" /></p>
                        <p><label>闭合</label><input type="checkbox" v-model="sign.isClose" /></p>
                        <p><label>填充</label><input type="checkbox" v-model="sign.isFill" /></p>
                    </div>
                </div>
                <div class="tools-items" v-show="secondType=='gauged'">
                    <p>标画特征</p>
                    <p>形式</p>
                    <div class="item-items">
                        <p :class="sign.lineType == 'line' ? 'active': ''" @click="sign.lineType = 'line'"><span class="icon iconfont" >&#xe8e3;</span>直线</p>
                        <p :class="sign.lineType == 'arrow' ? 'active': ''" @click="sign.lineType = 'arrow'"><span class="icon iconfont" >&#xe8e5;</span>单箭头</p>
                        <p :class="sign.lineType == 'double_arrow' ? 'active': ''" @click="sign.lineType = 'double_arrow'"><span class="icon iconfont" >&#xe8e7;</span>双箭头</p>
                        <p :class="sign.lineType == 'double_header' ? 'active': ''" @click="sign.lineType = 'double_header'"><span class="icon iconfont" >&#xe945;</span>两端头线</p>
                    </div>
                    <p>线型</p>
                    <div class="item-items">
                        <p :class="sign.isSolid == true ? 'active': ''" @click="sign.isSolid = true"><span class="icon iconfont" >&#xe8e0;</span>直线</p>
                        <p :class="sign.isSolid == false ? 'active': ''" @click="sign.isSolid = false"><span class="icon iconfont" >&#xe8de;</span>虚线</p>
                    </div>
                    <p>颜色</p>
                    <div class="item-box-full">
                        <span class="icon iconfont white" @click="sign.color = 'white'">&#xe854;</span>
                        <span class="icon iconfont black" @click="sign.color = 'black'">&#xe854;</span>
                        <span class="icon iconfont yellow" @click="sign.color = 'yellow'">&#xe854;</span>
                        <span class="icon iconfont green" @click="sign.color = 'green'">&#xe854;</span>
                        <span class="icon iconfont orange" @click="sign.color = 'orange'">&#xe854;</span>
                        <span class="icon iconfont red" @click="sign.color = 'red'">&#xe854;</span>
                    </div>
                    <p>大小</p>
                    <div class="item-items">
                        <el-slider v-model="sign.size.value" :min="sign.size.min" :max="sign.size.max"></el-slider>
                    </div>
                    <div class="item-items">
                        <p @click="secondType='sign'"><span class="icon iconfont" >&#xe6cd;</span>返回</p>
                    </div>
                </div>

            </div>
        </div>
        <div class="right-con">
            <div class="right-con-body">
                <div id="canvasDiv" class="canvasDiv">
                    <canvas id="canvas" width="100%" height="100%" style="z-index:0;">请使用支持HTML5的浏览器</canvas>
                </div>
            </div>
            <div class="right-con-oper">
                <div class="right-con-oper">
                    <span @click="changeImageType()" class="icon iconfont" title="二值图">&#xe88c;</span>
                    <span @click="verticalFlip()" class="icon iconfont" title="垂直">&#xe6c7;</span>
                    <span @click="horizontalFlip()" class="icon iconfont" title="水平">&#xe6c5;</span>
                    <div class="spliter"></div>
                    <span v-if="indexRight<2" class="icon iconfont draw-turn-pre-disable" title="前一张">&#xe6f7;</span>
                    <span v-else @click="previous()" class="icon iconfont draw-turn-pre" title="前一张">&#xe6f7;</span>
                    <span class="text" style="display: -moz-inline-box;display: inline-block;width: 60px;">&nbsp;{{indexRight}}/{{countCompareImage}}&nbsp;</span>
                    <span v-if="indexRight > countCompareImage - 1 || countCompareImage == 0" class="icon iconfont draw-turn-pre-disable" title="下一张">&#xe6f6;</span>
                    <span v-else @click="next()" class="icon iconfont draw-turn-pre" title="下一张">&#xe6f6;</span>
                    <div class="spliter"></div>
                    <!--<span @click="setLeft()" class="text" title="设为左图">设为左图</span>-->
                    <span class="text">&nbsp;透明度&nbsp;</span>
                    <!--<span class="icon iconfont zoom-btn sub" @click="transSub()" onselectstart="return false">&#xe88d;</span>-->
                    <div class="btm-slide">
                        <el-slider v-model="transObj.value" :min="transObj.min" :max="transObj.max" :show-tooltip="false" :step="0.01"></el-slider>
                    </div>
                    <span class="percent">&nbsp;{{transObj.percent}}</span>
                    <div class="spliter" style="margin:0 16px;"></div>
                    <!--<span class="icon iconfont zoom-btn add" @click="transAdd()" onselectstart="return false">&#xe882;</span>-->
                    <span class="text">&nbsp;大小</span>
                    <!--<span class="icon iconfont zoom-btn sub" @click="zoomSub()" onselectstart="return false">&#xe88d;</span>-->
                    <div class="btm-slide">
                        <el-slider v-model="zoomObj.percent" :min="10" :max="100"  :show-tooltip="false" @input="setZoomPercent()"></el-slider>
                    </div>
                    <span class="percent">&nbsp;{{zoomObj.percentStr}}&nbsp;&nbsp;</span>
                        <!--<span class="icon iconfont zoom-btn add" @click="zoomAdd()" onselectstart="return false">&#xe882;</span>-->

                    <span @click="originSize()" class="icon iconfont" title="原物大">&#xe6c3;</span>
                    <span @click="adaptiveSize()" class="icon iconfont" title="自适应">&#xe6c4;</span>
                    <span @click="remove()" class="icon iconfont" :style="deleteVisibility" title="删除">&#xe6dc;</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Compare from '@/utils/ImgCompare'
export default {
    data(){
        return {
            background: 'white',
            type: '',
            secondType:'',
            sign: {
                shape: 'sign_line',
                color: 'white',
                size: { min: 0, max: 30, value: 10 },
                isFill: false,
                isClose: false,
                isMeasure: false,
                lineType: 'line', //'arrow' , 'double_arrow', 'double_header'
                isSolid: true//'solid'//'dotted'
            },
            zoomObj: {
                value: 1,
                min: 0.5,
                max: 3.0,
                percent: 100,
                percentStr: '100%'
            },
            transObj: {
                value: 0.6,
                min: 0.0,
                max: 1.0,
                percent: '60%'
            },
            gaugedSize: 0,
            compareData: null,
            deleteVisibility: "visibility:visible",
            indexRight:0,
            countCompareImage:0,
            isNeedSetCompareScale:true,
        };
    },
    mounted() {
        this.init();
    },
    watch: {
        'sign': {
            handler(n, o) {
                this.setSignClass();
            },
            deep: true,
            immediate: false
        },
        'transObj.value': {
            handler(n, o) {
                this.setTransValue();
            },
            deep: false,
            immediate: false
        }
    },
    methods: {
        init() {
            var _this = this;
            this.compare = new Compare('canvas', 'canvasDiv', function (zoomObj) {
                _this.zoomObj.min = zoomObj.min;
                _this.zoomObj.max = zoomObj.max;
                _this.zoomObj.value = zoomObj.currentLevel;
                _this.zoomObj.percentStr = zoomObj.percent + '%';
                if (zoomObj.percent > 100)
                    zoomObj.percent = 100;
                if (zoomObj.percent < 5)
                    zoomObj.percent = 5;
                if (_this.zoomObj.percent != zoomObj.percent) {
                    _this.zoomObj.percent = zoomObj.percent;
                }
            }, function (signClass) {
                _this.sign = {
                    shape: signClass.shape,
                    color: signClass.color,
                    size: {
                        min: _this.sign.size.min,
                        max: _this.sign.size.max,
                        value: signClass.size
                    },
                    isFill: signClass.isFill,
                    isClose: signClass.isClose,
                    isMeasure: signClass.isMeasure,
                    lineType: signClass.lineType,
                    isSolid: signClass.isSolid
                };
            },
                function (currentScaleValue) {
                    _this.showScaleInputDialog(currentScaleValue);
                }
            );

            

            document.addEventListener('keydown', function (e) {
                var evn = e || event;
                var code = evn.keyCode || evn.which || evn.charCode;
                if (code === 46) {//keyCode 46 = Delete
                    if (_this.type === 'sign')
                        _this.deleteSign();
                }
            });
        },

        initImage(compareData) {
            this.compareData = compareData;
            if (this.compareData.type === 'classific') {
                this.deleteVisibility = "visibility:hidden";
            } else {
                this.deleteVisibility = "visibility:visible";
            }
            var rightIndex = 0;
            for (var i = 0; i < compareData.rightIndex; i++) {
                rightIndex += compareData.right[i].picList.length;
            }
            rightIndex += compareData.rightItemIndex + 1;
            this.countCompareImage = compareData.imageInfos.length - 1;
            this.indexRight = rightIndex;
            this.compare.initImage(compareData.imageInfos, rightIndex);
        },
        save() {
            this.compare.save();
        },
        setScaleDraw() {
            this.secondType = '';
            this.compare.setScaleDraw();
        },
        setSignClass() {
            this.compare.setSignClass(this.sign.shape, this.sign.color, this.sign.size.value, this.sign.isFill, this.sign.isClose, this.sign.isMeasure, this.sign.lineType, this.sign.isSolid);
        },
        setSignShapeDrawType(type) {
            this.compare.setSignShapeDrawType(type);
        },
        setBackgroundColor(color) {
            this.compare.setBackgroundColor(color);
        },
        previous() {
            // this.compare.previous();
            if(this.indexRight < 2 || this.countCompareImage === 0)
                return;
            this.indexRight--;
            this.compare.setRightImageIndex(this.indexRight);
        },
        next() {
            // this.compare.next();
            if(this.indexRight > this.countCompareImage - 1 || this.countCompareImage === 0)
                return;
            this.indexRight++;
            this.compare.setRightImageIndex(this.indexRight);
        },
        transSub() {
            this.compare.transSub();
            this.transObj.value -= 0.01;
            this.transObj.percent = Math.round(this.transObj.value * 100) + '%';
        },
        transAdd() {
            this.compare.transAdd();
            this.transObj.value += 0.01;
            this.transObj.percent = Math.round(this.transObj.value * 100) + '%';
        },
        setTransValue() {
            this.transObj.percent = Math.round(this.transObj.value * 100) + '%';
            this.compare.setTransValue(this.transObj.value);
        },
        zoomSub() {
            this.compare.zoomSub();
        },
        zoomAdd() {
            this.compare.zoomAdd();
        },
        setZoomValue() {
            this.compare.setZoomValue(this.zoomObj.value);
        },
        setLeft() {
            this.compare.setLeft();
        },
        horizontalFlip() {
            this.compare.horizontalFlip();
        },
        verticalFlip() {
            this.compare.verticalFlip();
        },
        changeImageType() {
            this.compare.changeImageType();
        },
        // 比例尺输入弹窗
        showScaleInputDialog(currentScaleValue) {
            this.$prompt('', '设置比例尺', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                inputPattern: /(^[1-9]{1}$)|(^[1-9]{1}[\.]{1}[0-9]{1,2}$)|(^[0]{1}[\.]{1}[1-9]{1}$)|(^[0]{1}[\.]{1}[0-9]{1}[1-9]{1}$)|(^[1-4]{1}[0-9]{1}$)|(^[1-4]{1}[0-9]{1}[\.]{1}[0-9]{1,2}$)|(^[5]{1}[0]{1}$)|(^[5]{1}[0]{1}[\.]{1}[0-9]{1,2}$)/,
                inputErrorMessage: '输入格式不正确',
                inputValue: currentScaleValue,
                closeOnClickModal:false
            }).then(({ value }) => {
                if (value) {
                    this.compare.setScaleValue(value);
                    this.compare.setEmptyDrawType();
                    this.type = '';
                }
            }).catch(() => {
                this.compare.setScaleCancel();
                this.compare.setEmptyDrawType();
                this.type = '';
            });
        },

        originSize() {
            this.isNeedSetCompareScale = false;
            this.compare.originSize();
        },

        adaptiveSize() {
            this.isNeedSetCompareScale = false;
            this.compare.adaptiveSize();
        },

        deleteSign() {
            this.compare.deleteSign();
        },

        setZoomPercent() {
            if(this.isNeedSetCompareScale){
                this.compare.setZoomPercent(this.zoomObj.percent);
                this.zoomObj.percentStr = this.zoomObj.percent + "%";
            }else{
                this.isNeedSetCompareScale=true;
            }
        },

        remove() {
            if(this.compareData.right.length ==0)
                return;
            var messgage = this.compareData.type == 'scene' ? '确定删除当前图片对应的案件？' : '确定删除当前图片对应的鞋样？';
            if(this.compareData.right.length == 1){
                messgage = this.compareData.type == 'scene' ? '确定删除最后一个案件吗？' : '确定删除最后一个鞋样吗？';
            }
            var _this = this;
            this.$confirm(messgage, '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'info'
            }).then(() => {
                _this.deleteRight();
            }).catch(() => {
            });
        },

        deleteRight() {
            var message = {
                type: this.compareData.type
            };
            var currentRightIndex = this.compare.getCurrentRightIndex();
            if (currentRightIndex == 0) return;
            var start = 1, count = 0, point = 0, rightIndex=0;
            for (var i = 0; i < this.compareData.right.length; i++) {
                point = start + this.compareData.right[i].picList.length;
                if (point > currentRightIndex) {
                    count = this.compareData.right[i].picList.length;
                    if (i == this.compareData.right.length - 1) {
                        rightIndex = start - 1;
                    } else {
                        rightIndex = start;
                    }
                    message.info = this.compareData.right[i];
                    this.compareData.right.splice(i, 1);
                    break;
                } else {
                    start += this.compareData.right[i].picList.length;
                }
            }
            // this.compareData.imageInfos.splice(start, count);
            var currentCount=0;
            this.compareData.right.forEach(p=>currentCount+=p.picList.length);
            this.indexRight = rightIndex;
            this.countCompareImage = currentCount;
            this.compare.removeCompareData(start, count, rightIndex);
            this.noticeOpener(message);
        },

        noticeOpener(message) {
            if (window.opener) {
                window.opener.messageProcess(message);
            }else if(window.top){
                window.top.messageProcess(message);
            }
        }
    }
}
</script>
