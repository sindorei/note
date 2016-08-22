<template>
  <div id="app">
    <img class="logo" src="../../assets/images/logo.png">
    <hello></hello>
    <p>
      Welcome to weixin demo
    </p>
    <toast :show="true"></toast>
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