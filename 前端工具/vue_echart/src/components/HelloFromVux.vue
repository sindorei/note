<template>
 <div>
    <view-box v-ref:view-box>
        <echarts :options="chart"></echarts>
    </view-box>
  </div>
</template>

<script>
import Echarts from 'vue-echarts/src/components/Echarts.vue'
import { Group, Cell, XHeader, ViewBox } from 'vux/src/components'
import Io from 'socket.io-client'
import moment from 'moment'

export default {
  components: {
    Group,
    Cell,
    XHeader,
    ViewBox,
    Echarts
  },
  methods: {
  },
  data () {
    return {
        forecast: [],
        trend: []
    }
  },
  created () {
    let self = this
    const socket = Io('http://10.1.200.65:8360', { path: '/socket.io' })
    let nowDate = moment().format('YYYY-MM-DD')
    socket.on('connect-success', function () {
        socket.emit('forecast', { start: nowDate, end: nowDate, type: 1 })
        socket.emit('ordertrend', { start: nowDate, end: nowDate, type: 1 })
    })

    setInterval(function () {
       socket.emit('ordertrend', { start: moment().format('YYYY-MM-DD'), end: moment().format('YYYY-MM-DD'), type: 1 })
    }, 120000)

    socket.on('forecastData', function (data) {
       let dataList = data.OrderResponse.OrderList.OrderStaticModel
       self.forecast = []
       for (let item of dataList) {
           self.forecast.push(item.COrders)
       }
    })
    socket.on('orderTrendData', function (data) {
        let dataList = data.OrderResponse.OrderList.OrderStaticModel
        self.trend = []
        for (let item of dataList) {
           self.trend.push(item.COrders)
        }
    })
  },
  computed: {
      period () {
        let times = []
        for (let i = 0; i < 24; i++) {
          times.push(i)
        }
        times.push(0)
        return times
      },
      chart: {
        cache: false,
        get () {
            let self = this
            return {
                title: {
                    text: '预测'
                },
                tooltip: {
                    trigger: 'axis'
                },
                legend: {
                    data: ['实时数据', '预测数据'],
                    right: 'center'
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                toolbox: {
                    feature: {
                        saveAsImage: {}
                    }
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: self.period
                },
                yAxis: {
                    type: 'value'
                },
                series: [
                    {
                        name: '预测数据',
                        type: 'line',
                        data: self.forecast
                    },
                     {
                        name: '实时数据',
                        type: 'line',
                        data: self.trend
                    }
                ],
                layout: 'horizontal'
            }
        }
      }
  }
}
</script>

<style>
.vux-demo {
  text-align: center;
}

.logo {
  width: 100px;
  height: 100px
}
/*.echarts {
  width: 100% !important;
}*/
</style>