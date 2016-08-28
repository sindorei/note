<template>
    <div class="dialog" v-show="show" :transition="maskTransition" transition-mode="in-out">
        <div class="dialog-main" :transition="dialogTransition">
            <p class="dialog-main-title">{{ title }}</p>
            <div class="dialog-main-con">
                <slot></slot>
            </div>
            <p class="dialog-main-bottom">
                <span v-if="cancelBtn" @click="cancel">{{ cancelBtn }}</span>
                <span @click="confirm">{{ confirmBtn }}</span>
            </p>
        </div>
    </div>
</template>

<script>
    export default {
        props: {
           show: {
               type: Boolean,
               default: false
           },
           title: {
               type: String,
               default: '温馨提示'
           },
           cancelBtn: {
               type: String
           },
           confirmBtn: {
               type: String,
               default: '确定'
           },
           maskTransition: {
               type: String,
               default: 'mask-fade'
           },
           dialogTransition: {
               type: String,
               default: 'dialog'
           }
        },
        methods: {
            cancel () {
                this.show = false
                this.$emit('dialog-cancel')
            },
            confirm () {
                this.show = false
                this.$emit('dialog-confirm')
            }
        }
    }
</script>

<style lang="scss" scoped>
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
.mask-fade-transition {
  opacity: 1;
  transition: opacity linear 0.2s;
}

.mask-fade-enter, .mask-fade-leave {
  opacity: 0;
}

.dialog-transition {
  opacity: 1;
  transition-duration: .4s;
  transform: translate(-50%, -50%) scale(1)!important;
  transition-property: transform, opacity!important;
}

.dialog-enter, dialog-leave {
  opacity: 0;
}

.dialog-enter {
  transform: translate(-50%, -50%) scale(1.185)!important;
}

.dialog-leave {
  transform: translate(-50%, -50%) scale(1)!important;
}
</style>