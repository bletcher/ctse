<template>
  <v-app>
    <v-app-bar app clipped-left dark>
      <v-toolbar-title class="headline">
        <span>SHEDS</span>
        <span class="font-weight-light px-2">|</span>
        <span class="font-weight-light">Time Series Explorer</span>
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
      <v-container
        fluid
        v-if="filledData"
      >
        <v-tabs
          v-model="tab"
        >
          <v-tab href="#means">Means</v-tab>
          <v-tab href="#timeseries">Time series</v-tab>
          <v-tab href="#doy">By day of year</v-tab>
        </v-tabs>

        <v-tabs-items v-model="tab">
          <v-tab-item :key="1" value="means" transition="fade-transition">
            <means-chart
              :extent="brushExtent"
            >
            </means-chart>
          </v-tab-item>
          <v-tab-item :key="2" value="timeseries" transition="fade-transition">
            <timeseries-chart
              :filledData="filledData"
              :extent="brushExtent"
            >
            </timeseries-chart>
          </v-tab-item>
          <v-tab-item :key="3" value="doy" transition="fade-transition">
            <allpoints-chart
              :dataByDay="dataByDay"
              :dataByDayOfYear="dataByDayOfYear"
            >
            </allpoints-chart>
          </v-tab-item>
        </v-tabs-items>

        <brush-chart
          :filledData="filledData"
          :extent="brushExtent"
          @brushed="onBrush">
        </brush-chart>
        <rect-chart
          :filledData="filledData"
          :extent="brushExtent">
        </rect-chart>

        <v-row align="center" justify="space-between" class="ml-2">
          <v-col cols="2" sm="2" md="2">
            <v-menu
              v-model="startDateMenu"
              :close-on-content-click="false"
              :nudge-right="180"
              transition="scale-transition"
              min-width="290px"
            >
              <template v-slot:activator="{ on }">
                <v-text-field
                  v-model="startDate"
                  label="Start date"
                  v-on="on"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="startDate"
                @input="startDateMenu = false; updateBrushExtentFromStartDate()"
              ></v-date-picker>
            </v-menu>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="2" sm="2" md="2">
            <v-menu
              v-model="endDateMenu"
              :close-on-content-click="false"
              :nudge-left="295"
              transition="scale-transition"
              min-width="290px"
            >
              <template v-slot:activator="{ on }">
                <v-text-field
                  v-model="endDate"
                  label="End date"
                  v-on="on"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="endDate"
                @input="endDateMenu = false; updateBrushExtentFromEndDate()"
              ></v-date-picker>
            </v-menu>
          </v-col>
        </v-row>
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
  julian: d3.timeFormat('%j'),
  parseDatePicked: d3.timeParse('%Y-%m-%d'),
  ymd: d3.timeFormat('%Y-%m-%d')
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
    dataFileNames: ['1949884.csv', '1949884_partial.csv', 'mitchellFromSHEDS.csv'], // , 'co2_mm_mlo.csv'],
    selectedFileName: null,
    startDate: null,
    endDate: null,
    startDateMenu: false,
    endDateMenu: false,
    tab: 'doy',
    overlayValue: false
  }),
  mounted () {
  },
  watch: {
    selectedFileName () {
      this.getData()
    },
    filledData () {
      console.log('App:watch:filledData')
      this.brushExtent = d3.extent(this.filledData, d => d.date)
      this.startDate = formatters.ymd(this.brushExtent[0])
      this.endDate = formatters.ymd(this.brushExtent[1])
    }
  },
  computed: {
    filledData () {
      if (this.rawData.length === 0) return
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

        if (!dateIncludedTF) { // missing data
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
      return Object.freeze(filled)
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
      return meanByDayOfYear
    }
  },
  methods: {
    onBrush (extent) {
      this.brushExtent = extent
      this.startDate = formatters.ymd(extent[0])
      this.endDate = formatters.ymd(extent[1])
    },
    updateBrushExtentFromStartDate () {
      if (formatters.parseDatePicked(this.startDate) > this.brushExtent[1]) {
        alert('Start date must be before end date')
        this.startDate = formatters.ymd(this.extent[0])
        return
      }
      this.brushExtent = [formatters.parseDatePicked(this.startDate), this.brushExtent[1]]
    },
    updateBrushExtentFromEndDate () {
      if (this.brushExtent[0] > formatters.parseDatePicked(this.endDate)) {
        alert('End date must be after start date')
        this.startDate = formatters.ymd(this.extent[1])
        return
      }
      this.brushExtent = [this.brushExtent[0], formatters.parseDatePicked(this.endDate)]
    },
    getData () {
      console.log('getData:start')
      // for now
      let parseDate = null
      if (this.selectedFileName.includes('1949') || this.selectedFileName === 'co2_mm_mlo.csv') {
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
          this.rawData = Object.freeze(dat)
        })
        .catch(error => console.error(error))
    }
  }
}
</script>
