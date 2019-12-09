<template>
  <v-app>
    <v-container fluid>
      <v-row align="center">
        <v-col class="d-flex" cols="12" sm="6">
          <v-select
            :items="dataFileNames"
            v-model="selectedFileName"
            label="Data files"
            solo
          ></v-select>
<!--    <timeseries-chart :extent="brushExtent" :data="filledData" v-if="filledData"></timeseries-chart>
    <brush-chart :extent="brushExtent" @brushed="onBrush"></brush-chart>
    <chunk-chart></chunk-chart> -->
        </v-col>
      </v-row>
    </v-container>
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
    movingMeanWindow: 10,
    dataFileNames: ['1949884.csv', 'mitchellFromSHEDS.csv'],
    selectedFileName: null
  }),
  computed: {
    filledData () {
      console.log('filledData: start')

      let combined = []
      let startIndex = 0

      // get date range for all data. Will fill in missing observations
      const rawDataFullRange = d3.timeDay.range(d3.min(this.rawData, d => d.date), d3.max(this.rawData, d => d.date))

      // get all dates in dataByDay
      const dataByDayDates = this.dataByDay.map(d => d.key)

      console.log('rawDataDates', rawDataFullRange, dataByDayDates)

      // Loop over all dates and fill missing dates
      for (let i = 0; i < rawDataFullRange.length; i++) {
        let dateIncludedTF = dataByDayDates.includes(formatters.mdy(rawDataFullRange[i]))
        if (i % 1000 === 0) console.log('second', i, dateIncludedTF, this.rawData.length, startIndex)

        if (!dateIncludedTF) { // missing data
          console.log('in !')
          let dataFromDataByDayOfYear = this.dataByDayOfYear.find(d => +d.key === +formatters.julian(rawDataFullRange[i])) // not so slow because only searching through 365 lines
          combined.push({
            date: rawDataFullRange[i],
            dayOfYear: +formatters.julian(rawDataFullRange[i]),
            value: dataFromDataByDayOfYear.movingMean,
            missingData: true })
        } else { // existing data in rawData
          for (let j = startIndex; j < dataByDayDates.length; j++) {
            // console.log(i,j,formatters.mdy(rawDataFullRange[i]), dataByDayDates[j])
            if (formatters.mdy(rawDataFullRange[i]) === dataByDayDates[j]) {
              startIndex++
              combined.push({
                date: rawDataFullRange[i],
                dayOfYear: +formatters.julian(rawDataFullRange[i]),
                value: dataByDayDates[j].value,
                missingData: false
              })
              break
            }
          }
        }
      }
      console.log('filledData: end', combined)
      return combined
    },
    chunkData () {
      // filledData + brushExtent -> chunked data
      // could be module later
      return null
    },
    dataByDay () {
      console.log('dataByDay:start')
      let meanByDay = d3.nest()
        .key(d => d.day)
        .sortKeys((a, b) => d3.ascending(+a, +b))
        .rollup(d => d3.mean(d, v => v.value))
        .entries(this.rawData)

      return meanByDay
    },
    dataByDayOfYear () {
      console.log('dataByDayOfYear:start')
      let meanByDayOfYear = d3.nest()
        .key(d => +formatters.julian(d.date))
        .sortKeys((a, b) => d3.ascending(+a, +b))
        .rollup(d => d3.mean(d, v => v.value))
        .entries(this.rawData)

      // get moving mean and add to meanByDayOfYear
      // 'key' is julian day
      const movingMean = []
      for (var i = 0; i < meanByDayOfYear.length; i++) {
        if (i < this.movingMeanWindow || (i > meanByDayOfYear.length - this.movingMeanWindow - 1)) {
          meanByDayOfYear[i].movingMean = meanByDayOfYear[i].value
        } else {
          var total = 0
          for (var j = i - this.movingMeanWindow; j < i + this.movingMeanWindow; j++) {
            total += meanByDayOfYear[j].value
          }
          movingMean[i] = total / (this.movingMeanWindow * 2)
          meanByDayOfYear[i].movingMean = movingMean[i]
        }
      }
      console.log('dataByDayYear: end', meanByDayOfYear)
      return meanByDayOfYear
    }
  },
  mounted () {
    // this.getData()
  },
  watch: {
    rawData () {
      console.log('watch:rawData', this.rawData)
      this.initializeCharts()
    },
    selectedFileName () {
      this.getData()
    }
  },
  methods: {
    onBrush (extent) {
      this.brushExtent = extent
    },
    getData () {
      // for now
      let parseDate = null
      if (this.selectedFileName === '1949884.csv') {
        parseDate = d3.timeParse('%-m/%-d/%Y')
      } else if (this.selectedFileName === 'mitchellFromSHEDS.csv') {
        parseDate = d3.timeParse('%-m/%-d/%Y %H:%M')
      }
      return d3.csv('data/' + this.selectedFileName, d => {
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
