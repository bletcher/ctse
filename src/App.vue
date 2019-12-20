<template>
  <v-app>
    <v-app-bar app clipped-left dark>
      <v-toolbar-title class="headline">
        <span>SHEDS</span>
        <span class="font-weight-light px-2">|</span>
        <span class="font-weight-light">Time series explorer</span>
        <!-- <span class="font-weight-light px-2">|</span> -->
        <span class="text-uppercase overline ml-3">Alpha Version</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text small href="https://ecosheds.org">
        <v-icon small left>mdi-home</v-icon> SHEDS
      </v-btn>
    </v-app-bar>
    <v-content>
      <v-row align="center" justify="start" class="ml-2">
        <v-col class="d-flex" cols="3">
          <v-select
            :items="dataFileNames"
            v-model="selectedFileName"
            label="Data files"
            solo>
          </v-select>
        </v-col>
      </v-row>
      <v-container>
        <timeseries-chart
        :filledData="filledData"
        v-if="filledData"
        :extent="brushExtent"
        >
        </timeseries-chart>
        <brush-chart
          :filledData="filledData"
          v-if="filledData"
          :extent="brushExtent"
          @brushed="onBrush">
        </brush-chart>
        <rect-chart
          :filledData="filledData"
          v-if="filledData"
          :extent="brushExtent">
        </rect-chart>
        <means-chart
          v-if="filledData">
        </means-chart>
        <allpoints-chart
          :dataByDay="dataByDay"
          :dataByDayOfYear="dataByDayOfYear"
          v-if="filledData">
        </allpoints-chart>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import * as d3 from 'd3'
import TimeseriesChart from '@/components/TimeseriesChart'
import BrushChart from '@/components/BrushChart'
import RectChart from '@/components/RectChart'
import AllpointsChart from '@/components/AllpointsChart'
import MeansChart from '@/components/MeansChart'

const formatters = {
  mdy: d3.timeFormat('%B %d, %Y'),
  julian: d3.timeFormat('%j')
}

export default {
  name: 'App',

  components: {
    TimeseriesChart,
    BrushChart,
    RectChart,
    AllpointsChart,
    MeansChart
  },
  data: () => ({
    rawData: [],
    brushExtent: null,
    movingMeanWindow: 10,
    dataFileNames: ['1949884.csv', '1949884_partial.csv', 'mitchellFromSHEDS.csv'],
    selectedFileName: null
  }),
  mounted () {
  },
  watch: {
    filledData () {
      console.log('watch:filledData')
      // this.initializeCharts()
    },
    selectedFileName () {
      this.getData()
    }
  },
  computed: {
    filledData () {
      console.log('filledData:start')

      let filled = []
      let startIndex = 0

      // get date range for all data. Will fill in missing observations
      const rawDataFullRange = d3.timeDay.range(d3.min(this.rawData, d => d.date), d3.max(this.rawData, d => d.date))

      // get all dates in dataByDay
      const dataByDayDates = this.dataByDay.map(d => d.key)

      // Loop over all dates and fill missing dates
      for (let i = 0; i < rawDataFullRange.length; i++) {
        let dateIncludedTF = dataByDayDates.includes(formatters.mdy(rawDataFullRange[i]))
        // if (i % 1000 === 0) console.log('second', i, dateIncludedTF, this.rawData.length, startIndex)

        if (!dateIncludedTF) { // missing data
          // console.log('in !')
          let dataFromDataByDayOfYear = this.dataByDayOfYear.find(d => +d.key === +formatters.julian(rawDataFullRange[i])) // not so slow because only searching through 365 lines
          filled.push({
            date: rawDataFullRange[i],
            dayOfYear: +formatters.julian(rawDataFullRange[i]),
            value: dataFromDataByDayOfYear.movingMean,
            missingData: true })
        } else { // data exist in dataByDay
          for (let j = startIndex; j < dataByDayDates.length; j++) {
            if (formatters.mdy(rawDataFullRange[i]) === dataByDayDates[j]) {
              startIndex++
              filled.push({
                date: rawDataFullRange[i],
                dayOfYear: +formatters.julian(rawDataFullRange[i]),
                value: this.dataByDay[j].value,
                missingData: false
              })
              break
            }
          }
        }
      }
      console.log('filledData:end', filled)
      return Object.freeze(filled)
    },
    dataByDay () {
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
  methods: {
    onBrush (extent) {
      this.brushExtent = extent
    },
    getData () {
      // for now
      let parseDate = null
      if (this.selectedFileName.includes('1949')) {
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
    }
  }
}
</script>
