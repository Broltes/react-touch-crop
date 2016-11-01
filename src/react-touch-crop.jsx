import React from 'react';
import './style.less';

function _touchToPoint(touch) {
    return touch && {
        x: touch.pageX,
        y: touch.pageY,
        // id: touch.identifier
    };
}
function _calculatePointsDistance(p1, p2) {
    if(!p2) return 0;
    let x0 = Math.abs(p1.x - p2.x);
    let y0 = Math.abs(p1.y - p2.y);

    return Math.round(Math.sqrt(x0*x0 + y0*y0));
}
function _calculateCenterPoint(p1, p2) {
    if(!p2) return p1;
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p1.y) / 2
    };
}
function _limit(min, val, max){
    return Math.max(min, Math.min(max, val));
}

let _initialCenterPoint, _initialDistance, _initialScale,
    _initialX0, _initialY0, _minScale;
let _naturalWidth;// 图片真实宽度
let _initialWidth, _initialHeight;// 图片初始宽度, 高度
let _maskOffsetToBgX, _maskOffsetToBgY;// 前景相对于背景图片的x, y轴偏移量
let _scaleX = 0, _scaleY = 0;// 缩放导致的x, y轴补偿
let _cropW, _cropH;// 裁切框尺寸

export default React.createClass({
    getInitialState() {
        return {
            x0: 0,
            y0: 0,
            scale: 1,
            transition: 0
        };
    },
    init({ target }) {
        let { mask } = this.refs;

        _naturalWidth = target.naturalWidth;
        _initialWidth = target.clientWidth;
        _initialHeight = target.clientHeight;

        _maskOffsetToBgX = mask.offsetLeft - target.offsetLeft;
        _maskOffsetToBgY = mask.offsetTop - target.offsetTop;
        _cropW = mask.clientWidth;
        _cropH = mask.clientHeight;
        _minScale = Math.max(_cropW / _initialWidth, _cropH / _initialHeight);
    },
    crop() {
        const { scale, x0, y0 } = this.state;
        // 计算图片真实尺寸与当前所见尺寸缩放比率
        var cropScale = _naturalWidth / (_initialWidth * scale);

        // 起始点相对距离
        var viewX = _maskOffsetToBgX - x0 + _scaleX;
        var viewY = _maskOffsetToBgY - y0 + _scaleY;

        // 计算矩形裁切点
        return [
            Math.round(cropScale * viewX),
            Math.round(cropScale * viewY),
            Math.round(cropScale * _cropW),
            Math.round(cropScale * _cropH)
        ];
    },

    touchStart({ touches }) {
        let p1 = _touchToPoint(touches[0]);
        let p2 = _touchToPoint(touches[1]);

        _initialDistance = _calculatePointsDistance(p1, p2);
        _initialCenterPoint = _calculateCenterPoint(p1, p2);

        let { scale, x0, y0 } = this.state;
        _initialScale = scale;
        _initialX0 = x0;
        _initialY0 = y0;
    },
    touchMove(e) {
        e.preventDefault();
        let nextState = { transition: 0 };
        let p1 = _touchToPoint(e.touches[0]);
        let p2 = _touchToPoint(e.touches[1]);

        if(p2) {
            // 缩放
            let scale = _calculatePointsDistance(p1, p2) / _initialDistance;
            let destScale = nextState.scale = scale * _initialScale;
            let scaleRadio = destScale / _initialScale;
            let centerPoint = _calculateCenterPoint(p1, p2);

            // 处理缩放后的偏移
            nextState.x0 = (_initialX0 + centerPoint.x - _initialCenterPoint.x) * scaleRadio;
            nextState.y0 = (_initialY0 + centerPoint.y - _initialCenterPoint.y) * scaleRadio;
        } else {
            // 简单移动
            nextState.x0 = p1.x - _initialCenterPoint.x + _initialX0;
            nextState.y0 = p1.y - _initialCenterPoint.y + _initialY0;
        }

        this.setState(nextState);
    },
    touchEnd({ touches }) {
        const { scale, x0, y0 } = this.state;
        let nextState = {
            transition: 1,
            scale: Math.max(_minScale, scale)
        };

        if(touches.length) {
            // 重置初始触点，防止触摸切换时跳跃
            _initialCenterPoint = _touchToPoint(touches[0]);
            _initialX0 = x0;
            _initialY0 = y0;
        } else {// 操作结束，校验边界
            // 缩放导致的X轴补偿
            _scaleX = (_initialWidth * nextState.scale - _initialWidth) / 2;
            _scaleY = (_initialHeight * nextState.scale - _initialHeight) / 2;

            // 计算前景偏移边界
            let maxX = _scaleX + _maskOffsetToBgX;
            let maxY = _scaleY + _maskOffsetToBgY;

            nextState.x0 = _limit(-maxX, x0, maxX);
            nextState.y0 = _limit(-maxY, y0, maxY);
        }

        this.setState(nextState);
    },
    render() {
        const {
            props: { className = '', img },
            state: { x0, y0, scale, transition },
            init, touchStart, touchMove, touchEnd
        } = this;

        return (
            <div className={`tcrop ${transition ? '_transition' : ''} ${className}`}
                onTouchStart={touchStart}
                onTouchMove={touchMove}
                onTouchEnd={touchEnd}>

                <div className="tcrop-bg" style={{
                        WebkitTransform: `translate3d(${x0}px,${y0}px, 0) scale(${scale})`
                    }}>
                    <img src={img} onLoad={init}/>
                </div>
                <div ref="mask" className="tcrop-mask"></div>
            </div>
        );
    }
});
