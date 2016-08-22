<template>
  <div id="app">
    <img class="logo" src="../../assets/images/logo.png">
    <hello></hello>
    <p>
      Welcome to voucher Demo 哈哈哈
    </p>
    <toast :show="false"></toast>
  </div>
</template>

<script>
import Hello from '../../components/Hello'
import Toast from '../../components/Toast'

export default {
  components: {
    Hello,
    Toast
  }
}
</script>

<style lang="sass">
@import "../../assets/style/demo";
</style>