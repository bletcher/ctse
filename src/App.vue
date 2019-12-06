<template>
  <v-app>
<!--    <timeseries-chart :extent="brushExtent" :data="filledData" v-if="filledData"></timeseries-chart>
    <brush-chart :extent="brushExtent" @brushed="onBrush"></brush-chart>
    <chunk-chart></chunk-chart> -->
  </v-app>
</template>

<script>
import * as d3 from 'd3'

const formatters = {
  mdy: d3.timeFormat('%B %d, %Y'),
  julian: d3.timeFormat('%j')
}

export default {
  name: 'App',

  components: {
  },

  data: () => ({
    rawData: [],
    brushExtent: null,
    movingMeanWindow: 10
  }),
  computed: {
    filledData () {
      console.log("filledData, start")
      // fill data

   //   let dateRange = []
      let combined = []
   //   let startIndex = 0
   //   let dataFromRawData = null

      // get date range for all data. Will fill in missing observations
      const rawDataFullRange = d3.timeDay.range(d3.min(this.rawData, d => d.date), d3.max(this.rawData, d => d.date))

      // get all dates in rawData
      const rawDataDates = this.rawData.map(d => formatters.mdy(d.date))
//console.log(rawDataFullRange, rawDataDates)
      // Loop over all dates and fill missing dates
      for (let i = 0; i < rawDataFullRange.length; i++) {
        //console.log ('first',i)
        //dateRange.push({ date: dateRange1[i], dayOfYear: +formatters.julian(dateRange1[i]) })
        let dateIncludedTF = rawDataDates.includes(formatters.mdy(rawDataFullRange[i]))
        //console.log ('second',i, dateIncludedTF)
        if (!dateIncludedTF) { // missing data
          console.log (i, rawDataFullRange[i], formatters.julian(rawDataFullRange[i]), this.dataByDayOfYear, +this.dataByDayOfYear[0].key)
          let dataFromDataByDayOfYear = this.dataByDayOfYear.find(d => d.key === formatters.julian(rawDataFullRange[i])) // not so slow because only searching through 365 lines
          console.log(dataFromDataByDayOfYear)

          combined.push({ date: d.date, dayOfYear: d.dayOfYear, value: dataFromDataByDayOfYear.movingMean, missingData: true})     
       

        }



      }
/*


      for (let i = 0; i < dateRange.length; i++)
        let dataFromDataInTF = rawDataDates.includes(formatters.mdy(d.date))


        if (!dataFromDataInTF) { // missing data
          console.log (d,i,dataFromDataInTF)
          let dataFromDataByDayOfYear = this.dataByDayOfYear.find(dd => +dd.key === d.dayOfYear) // not so slow because only searching through 365 lines
          combined.push({ date: d.date, dayOfYear: d.dayOfYear, value: dataFromDataByDayOfYear.movingMean, missingData: true })
        } else {
          // let dataFromRawData = findDate(this.startIndex, formatters.mdy(d.date))
       //   for (let j = startIndex; j < this.rawData.length; j++) { 
        //    console.log(i,j)
        //    let dataInData = this.rawData[j]
        //    if (formatters.mdy(d.date) === formatters.mdy(this.rawData[j].date)) {
        //      startIndex++
        //      dataFromRawData = dataInData
        //    }
        //  }
     //     combined.push({ date: d.date, dayOfYear: d.dayOfYear, value: dataFromRawData.value, missingData: false })
        } 
      })
*/
console.log("filledData, end")
      return combined
    },
    chunkData () {
      // filledData + brushExtent -> chunked data
      // could be module later
    },
    dataByDayOfYear () {
      console.log("dataByDayYear, start")
      let meanByDay = d3.nest()
        .key(d => +formatters.julian(d.date))
        .sortKeys((a, b) => d3.ascending(+a, +b))
        .rollup(d => d3.mean(d, v => v.value))
        .entries(this.rawData)

      // get moving mean and add to meanByDay
      // 'key' is julian day
      const movingMean = [] 
      for (var i = 0; i < meanByDay.length; i++) {
        if (i < this.movingMeanWindow || (i > meanByDay.length - this.movingMeanWindow - 1)) {
          meanByDay[i].movingMean = meanByDay[i].value
        } else {
          var total = 0;
          for (var j = i - this.movingMeanWindow; j < i + this.movingMeanWindow;  j++) {
            total += meanByDay[j].value
          }
          movingMean[i] = total / (this.movingMeanWindow * 2)
          meanByDay[i].movingMean = movingMean[i]
        } 
      }
      console.log("dataByDayYear, end")
      return meanByDay
    }
  },
  mounted () {
    this.getData()
  },
  watch: {
    rawData () {
      console.log('watch:rawData', this.rawData)
      this.initializeCharts()
    }
  },
  methods: {
    onBrush (extent) {
      this.brushExtent = extent
    },
    getData () {
      const parseDate = d3.timeParse('%-m/%-d/%Y')
      return d3.csv('data/1949884.csv', d => {
        d.date = parseDate(d.date)
        d.day = formatters.mdy(d.date)
        // d.dayOfYear = +formatters.julian(d.date)
        d.value = +d.value
        return d
      })
        .then(dat => {
          console.log('dat', dat)
          this.rawData = Object.freeze(dat)
        })
        .catch(error => console.error(error))
    },
    initializeCharts () {
      console.log('initializeCharts')

      // .on("brush", (brushExtent) => {
      //   this.$emit('brushed', brushExtent)
      // })
      
    }
  }
}
</script>
