<template>
    <div class="dialog">
        <div class="dialog-main">
            <p class="dialog-main-title">温馨提示</p>
            <div class="dialog-main-con">
                剩余票量不足，请选择其他航班剩余票量不足，请选择其他航班剩余票量不足，请选择其他航班剩余票量不足，请选择其他航班剩余票量不足，请选择其他航班
            </div>
            <p class="dialog-main-bottom">
                <span>取消</span>
                <span>确认</span>
            </p>
        </div>
    </div>
</template>

<script>
    export default {
        pops () {
           show: {
               type: String,
               required: true,
               default: false
           }
        }
    }
</script>

<style lang="scss">
.dialog {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, .6);
}
.dialog-main {
    position: fixed;
    z-index: 2000;
    width: 68.75%;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background-color: #fff;
    border-radius: 4px;
    overflow: hidden;
    font-size: 14px;
    color: #333;
    text-align: left;
    line-height: 20px;
    p {
        margin: 0;
        padding: 0;
    }
    .dialog-main-title {
        padding: 16px 18px 0;
        font-size: 12px;
        color: #666;
        
    }
    .dialog-main-con {
        padding: 12px 18px 18px;
        font-size: 14px;  
    }
    .dialog-main-bottom {
        display: flex;
        position: relative;
        color: #28c54d;
        text-align: center;
        &:after {
            position: absolute;
            top: 0;
            left: 0;
            content: '';
            width: 100%;
            height: 1px;
            border-top: 1px solid #eaeaea;
            transform: scaleY(.5);
            transform-origin: 0 0;
            color: #eaeaea;
        }
        span {
            flex: 1;
            line-height: 40px;
            &:active {
                background-color: #f1f1f1;
            }
            &:nth-of-type(2) {
                position: relative;
                &:after {
                    position: absolute;
                    top: 0;
                    left: 0;
                    content: "";
                    width: 1px;
                    height: 100%;
                    border-left: 1px solid #eaeaea;
                    transform: scaleX(.5);
                    transform-origin: 0 0;
                    color: #eaeaea;
                }
               
            }
        }
    }
}
</style>