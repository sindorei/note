<template>
  <div id="app" class="app">
    <img class="logo" src="../../assets/images/logo.png">
    <hello></hello>
    <p @click="showDialog" >
      Welcome to weixin demo
    </p>
    <dialog :show="display" cancel-btn="取消" @dialog-cancel="cancel" @dialog-confirm="confirm">
    剩余票量不足，请选择其他航班剩余票量不足
    </dialog>
  </div>
</template>

<script>
import Hello from '../../components/Hello'
import Dialog from '../../components/Dialog'

export default {
  components: {
    Hello,
    Dialog
  },
  data () {
    return {
      display: false
    }
  },
  methods: {
    showDialog () {
      this.display = !this.display
    },
    cancel () {
      console.log('取消了')
    },
    confirm () {
      console.log('确认了')
    }
  }
}
</script>

<style lang="scss">
@import "../../assets/style/demo";
</style>