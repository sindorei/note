<template>
  <div>
    
    <group>
      <cell title="预测" link="/forecast" value="">
      </cell>
    </group>
  </div>
</template>

<script>
import { Cell, Group, Badge } from 'vux/src/components'
export default {
  components: {
    Cell,
    Group,
    Badge
  },
  data () {
    return {
    }
  }
}
</script>

<style>
.center {
  margin-top: 15px;
  text-align: center;
}
.vux-notice {
  color: #666;
  line-height: 40px;
}
.vux-title {
  vertical-align: middle;
  text-align: center;
  color: #04BE02;
  display: inline-block;
  width: 75px;
  height: 75px;
  line-height: 75px;
  border-radius: 50%;
}
body {
  font-family: Helvetica, sans-serif;
  background-color: #fbf9fe;
}
</style>
