<template>
  <v-app>

    <v-app-bar app clipped-left dark>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
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
      <v-navigation-drawer
        v-model="drawer"
        app
        clipped
      >
        <v-list
          class="grey lighten-4"
        >
          <v-select
            label="Select an example CSV file"
            :items="selectedFileNames"
            v-model="selectedFileName"
            prepend-icon="mdi-file-upload-outline"
            class="pa-4 pt-6 pb-0"
          >
          </v-select>

          <v-dialog
            v-model="dialogs.dataSources"
            scrollable
            width="660">
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" x-small top rounded :style="{left: '50%', transform:'translateX(-50%)'}">
                <v-icon size="16">mdi-information-outline</v-icon> Data sources
              </v-btn>
            </template>

            <v-card>
              <v-toolbar dense color="grey lighten-2">
                <strong>Data sources</strong>
                <v-spacer></v-spacer>
                <v-btn height="24" width="24" icon @click="dialogs.dataSources = false" class="grey darken-1 elevation-2 mr-0" dark>
                  <v-icon small>mdi-close</v-icon>
                </v-btn>
              </v-toolbar>

              <v-card-text class="mt-2">
                <p><b>oregonTemp</b>: Daily air temperature from Malheur Branch experiment station (OR) <a href="https://www.ncdc.noaa.gov/cdo-web/datasets/GHCND/stations/GHCND:USC00355160/detail" target="_blank">NOAA</a></p>
                <p><b>co2MaunaLoa</b>: Monthly CO2 concentration at Mauna Loa <a href="https://www.esrl.noaa.gov/gmd/ccgg/trends/data.html" target="_blank">NOAA</a></p>
                <p><b>BradleyPrecipInches</b>: Daily precipitation at Bradley airport (CT) <a href="https://www.ncdc.noaa.gov/cdo-web/datasets/GHCND/stations/GHCND:USW00014740/detail" target="_blank">NOAA</a></p>
                <p><b>BradleySnow_mm</b>: Daily snowfall at Bradley airport (CT) <a href="https://www.ncdc.noaa.gov/cdo-web/datasets/GHCND/stations/GHCND:USW00014740/detail" target="_blank">NOAA</a></p>
                <p><b>lakeSimulation</b>: Daily lake temperature from a simulation, pers. comm. Jordan Read, USGS</p>
                <p><b>globalTempAnnual</b>: Annual global temperature from PAGES2K consortium <a href="https://figshare.com/articles/Reconstruction_ensemble_median_and_95_range/8143094" target="_blank">NOAA</a></p>
                <p><b>globalTempMonthly</b>: Montlhy global temperature from NOAA <a href="https://data.giss.nasa.gov/gistemp/" target="_blank">NOAA</a></p>
                <p><b>reconstructedPrecip</b>: Annual reconstructed precipitation for growing season (May to August) from Laura Smith (University of Tennessee). Based on tree ring data <a href="" target="_blank">UT</a></p>
              </v-card-text>
            </v-card>
          </v-dialog>

          <v-divider
            dark
            class="my-3 darkgrey"
          ></v-divider>

          <v-file-input
            label="Upload a CSV file"
            small-chips
            accept=".csv"
            v-model="inputFileName"
            class="pa-4 pt-6 pb-0"
          >
          </v-file-input>

          <v-dialog
            v-model="dialogs.about"
            scrollable
            width="600">
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" x-small top rounded :style="{left: '50%', transform:'translateX(-50%)'}">
                <v-icon size="16">mdi-information-outline</v-icon> File format
              </v-btn>
            </template>

            <v-card>
              <v-toolbar dense color="grey lighten-2">
                <strong>File format</strong>
                <v-spacer></v-spacer>
                <v-btn height="24" width="24" icon @click="dialogs.about = false" class="grey darken-1 elevation-2 mr-0" dark>
                  <v-icon small>mdi-close</v-icon>
                </v-btn>
              </v-toolbar>

              <v-card-text class="mt-2">
                <p>The csv file should have two columns, one for date and one for the time-series variable.</p>
                <p>The first row should be 'date,value'. For now, date data shold be formatted 'mm/dd/yyyy', e.g. '04/10/2020'. Value can be any number.</p>
              </v-card-text>
            </v-card>
          </v-dialog>
        </v-list>

        <v-divider
          class="my-2 white"
        ></v-divider>

        <v-list
          class="grey lighten-2"
        >
          <v-text-field
            v-model="selectedDepVar"
            hint="Change variable name on graph"
            persistent-hint
            prepend-icon="mdi-chart-line"
            class="pa-4 pt-8 pb-0"
          >
          </v-text-field>
          <v-divider
            dark
            class="my-3 white"
          ></v-divider>
          <v-select
            :items="timeStepsForSelect"
            v-model="selectedTimeStep"
            label="Time step"
            prepend-icon="mdi-timer"
            class="pa-4 pt-8 pb-0"
          >
          </v-select>
        </v-list>
      </v-navigation-drawer>
      <v-container
        v-if="filledData"
      >
        <v-card
          min-width="960px"
          max-width="960px"
          class="ma-6"
        >
          <v-tabs
            v-model="tab" background-color="#edebf2"
          >
            <v-tab href="#means">Means</v-tab>
            <v-tab href="#timeseries">Time series</v-tab>
            <v-tab href="#doy">By day of year</v-tab>
          </v-tabs>

          <v-tabs-items v-model="tab">
            <v-tab-item :key="1" value="means" transition="fade-transition">
              <means-chart
                :extent="brushExtent"
                :selectedDepVar="selectedDepVar"
                :chunkMeans="chunkMeans"
                :numChunks="numChunks"
                :filterMean="filterMean"
                :chunkCounters="chunkCounters"
              >
              </means-chart>
            </v-tab-item>
            <v-tab-item :key="2" value="timeseries" transition="fade-transition">
              <timeseries-chart
                :filledData="filledData"
                :extent="brushExtent"
                :selectedDepVar="selectedDepVar"
                :dataFilledCFD="dataFilledCFD"
                :filledDataExtentDate="filledDataExtentDate"
                :filledDataExtentValue="filledDataExtentValue"
                :brushedData="brushedData"
                :filterDaysForRect="filterDaysForRect"
                :numChunks="numChunks"
                :chunksData="chunksData"
                :chunkCounters="chunkCounters"
                :minOfMinCumul="minOfMinCumul"
                :maxOfMaxCumul="maxOfMaxCumul"
              >
              </timeseries-chart>
            </v-tab-item>
            <v-tab-item :key="3" value="doy" transition="fade-transition">
              <allpoints-chart
                :dataByDay="dataByDay"
                :dataByDayOfYear="dataByDayOfYear"
                :selectedDepVar="selectedDepVar"
              >
              </allpoints-chart>
            </v-tab-item>
          </v-tabs-items>
          <div v-show="tab !== 'doy'">
            <brush-chart
              :filledData="filledData"
              :extent="brushExtent"
              @brushed="onBrush"
              class="mb-0 pb-0"
            >
            </brush-chart>
            <rect-chart
              class="mt-0 pt-0"
              :filledData="filledData"
              :extent="brushExtent"
              :filterDaysForRect="filterDaysForRect"
              :numChunks="numChunks"
              :chunksData="chunksData"
              :chunkDaysForRect="chunkDaysForRect"
              :chunkCounters="chunkCounters"
            >
            </rect-chart>
            <v-spacer></v-spacer>
            <v-row align="end" justify="center" class="pa-2"
            >
              <v-col cols="2" sm="2" md="2" class="mr-1 grey lighten-4">
                <v-menu
                  v-model="startDateMenu"
                  :close-on-content-click="false"
                  :nudge-right="140"
                  transition="scale-transition"
                  min-width="290px"
                >
                  <template v-slot:activator="{ on }">
                    <v-text-field
                      v-model="startDate"
                      label="Start date"
                      hide-details
                      v-on="on"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="startDate"
                    @input="startDateMenu = false; updateBrushExtentFromStartDate()"
                  ></v-date-picker>
                </v-menu>
              </v-col>

              <v-col cols="2" sm="2" md="2" class="ml-1 grey lighten-4">
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
                      hide-details
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
          </div>
        </v-card>
      </v-container>
      <v-dialog v-model="dialogs.showIntro">
        <v-card>
          <p>test</p>
          <v-img
            src="./assets/intro.png"
          >
          </v-img>
        </v-card>
      </v-dialog>
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
  month: d3.timeFormat('%m'),
  parseDatePicked: d3.timeParse('%Y-%m-%d'),
  ymd: d3.timeFormat('%Y-%m-%d')
}
const oneDay = 24 * 60 * 60 * 1000

export default {
  name: 'App',

  components: {
    MeansChart,
    TimeseriesChart,
    AllpointsChart,
    BrushChart,
    RectChart
  },
  data: () => ({
    timeSeriesWidth: 960,
    timeSeriesMargin: {
      top: 20,
      right: 50,
      bottom: 20,
      left: 40
    },
    rawData: [],
    brushExtent: null,
    movingMeanWindow: 10,
    inputFileName: null,
    fileReaderIn: null,
    selectedFileNames: ['OregonTemp.csv', 'co2MaunaLoa.csv', 'BradleyPrecipInches.csv', 'BradleySnow_mm.csv', 'lakeSimulation.csv', 'globalTempAnnual.csv', 'globalTempMonthly.csv', 'reconstructedPrecip.csv'],
    selectedFileName: null,
    depVarNames: ['Temperature (C)', 'CO2', 'Precipitation (in)', 'Precipitation (mm)', 'Stream flow', 'Temperature (F)', 'Temperature (F)', 'Precipitation (mm)'],
    selectedDepVar: 'Value',
    startDate: null,
    endDate: null,
    startDateMenu: false,
    endDateMenu: false,
    tab: 'doy',
    overlayValue: false,
    timeStepsForSelect: ['Daily', 'Monthly', 'Yearly'],
    selectedTimeStep: null,
    drawer: true,
    dialogs: {
      about: false,
      showIntro: false
    },
    minCumulAll: [],
    minOfMinCumul: null,
    maxCumulAll: [],
    maxOfMaxCumul: null,
    filterDaysForRect: [],
    numChunks: null,
    chunksData: [],
    chunkDaysForRect: [],
    chunkMeans: [],
    chunkCounters: null,
    filterMean: {}
  }),
  mounted () {
  },
  watch: {
    selectedFileName () {
      this.getData()
      this.inputFileName = null
    },
    inputFileName () {
      if (this.inputFileName) {
        this.getDataInput()
        this.selectedFileName = null
      }
    },
    filledData () {
      this.brushExtent = d3.extent(this.filledData, d => d.date)
      this.startDate = formatters.ymd(this.brushExtent[0])
      this.endDate = formatters.ymd(this.brushExtent[1])
    },
    brushExtent () {
      this.emptyCumulAll()
      this.updateCumulAll(this.brushedData)

      this.updateFilterChunk() // change name of this to updateDaysForRect
      this.updateChunks()
    }
  },
  computed: {
    filledData () {
      if (this.rawData.length === 0) return

      let filled = []
      let startIndex = 0
      let rawDataFullRange = []

      // get date range for all data. Will fill in any missing observations
      if (this.selectedTimeStep === 'Daily') {
        rawDataFullRange = d3.timeDay.range(d3.min(this.rawData, d => d.date), d3.max(this.rawData, d => d.date))
      } else if (this.selectedTimeStep === 'Monthly') {
        rawDataFullRange = d3.timeMonth.range(d3.min(this.rawData, d => d.date), d3.max(this.rawData, d => d.date))
      } else if (this.selectedTimeStep === 'Yearly') {
        rawDataFullRange = d3.timeYear.range(d3.min(this.rawData, d => d.date), d3.max(this.rawData, d => d.date))
      } else {
        alert('Unknown time step')
      }

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
    },
    dataFilledCFD () {
      return this.getCumulFilteredDate(this.filledData, this.filledDataExtentDate[0], this.filledDataExtentDate[1])
    },
    filledDataExtentDate () {
      return d3.extent(this.filledData, d => d.date)
    },
    filledDataExtentValue () {
      return d3.extent(this.filledData, d => d.value)
    },
    brushedData () {
      return this.getCumulFilteredDate(this.filledData, this.brushExtent[0], this.brushExtent[1])
    },
    scalesxBrush () {
      return d3.scaleTime().range([0, this.timeSeriesChartWidth]).domain(this.filledDataExtentDate)
    },
    timeSeriesChartWidth () {
      return this.timeSeriesWidth - this.timeSeriesMargin.left - this.timeSeriesMargin.right
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
        this.startDate = formatters.ymd(this.brushExtent[0])
        return
      }
      this.brushExtent = [formatters.parseDatePicked(this.startDate), this.brushExtent[1]]
    },
    updateBrushExtentFromEndDate () {
      if (this.brushExtent[0] > formatters.parseDatePicked(this.endDate)) {
        alert('End date must be after start date')
        this.startDate = formatters.ymd(this.brushExtent[1])
        return
      }
      this.brushExtent = [this.brushExtent[0], formatters.parseDatePicked(this.endDate)]
    },
    getData () {
      console.log('getData:start')

      let parseDate = null
      if (this.selectedFileName === 'mitchellFromSHEDS.csv') {
        parseDate = d3.timeParse('%-m/%-d/%Y %H:%M')
      } else {
        parseDate = d3.timeParse('%-m/%-d/%Y')
      }

      let fileNameIndex = this.selectedFileNames.indexOf(this.selectedFileName)
      this.selectedDepVar = this.depVarNames[fileNameIndex]

      return d3.csv('data/' + this.selectedFileName, d => {
        d.date = parseDate(d.date)
        d.day = formatters.mdy(d.date)
        d.value = +d.value
        return d
      })
        .then(dat => {
          this.rawData = Object.freeze(dat)
          this.setTimeStep()
        })
        .catch(error => console.error(error))
    },
    getDataInput (e) {
      console.log('loadCSV', this.inputFileName)

      let parseDate = null

      if (window.FileReader) {
        let reader = new FileReader()
        reader.readAsText(this.inputFileName, 'UTF-8')

        reader.onloadend = () => {
          let csv = reader.result
          let csvFormatted = this.csvJSON(csv)

          // clunky parsing for now
          if (csvFormatted[0].date.length < 11) {
            parseDate = d3.timeParse('%-m/%-d/%Y')
          } else {
            parseDate = d3.timeParse('%-m/%-d/%Y %H:%M')
          }

          for (let i = 0; i < csvFormatted.length; i++) {
            csvFormatted[i].date = parseDate(csvFormatted[i].date)
            csvFormatted[i].day = formatters.mdy(csvFormatted[i].date)
            csvFormatted[i].value = +csvFormatted[i].value
          }
          this.rawData = Object.freeze(csvFormatted)
          this.setTimeStep()
        } // may need to make this asynchronous
        reader.onerror = function (evt) {
          if (evt.target.error.name === 'NotReadableError') {
            alert('Cannot read file !')
          }
        }
      } else {
        alert('FileReader is not supported in this browser.')
      }
    },
    csvJSON (csv) {
      let lines = csv.split('\n')
      let result = []
      let headers = lines[0].split(',')

      lines.map((line, indexLine) => {
        if (indexLine < 1) return // Jump header line

        const obj = {}
        let currentline = line.split(',')

        headers.map((header, indexHeader) => {
          obj[header.trim()] = currentline[indexHeader]
        })
        result.push(obj)
      })
      result.pop() // remove the last item because undefined values
      return result
    },
    setTimeStep () {
      // Check time step, assuming consistent time step
      let interval = d3.timeDay.count(this.rawData[0].date, this.rawData[1].date)
      if (interval < 3) {
        this.selectedTimeStep = 'Daily'
      } else if (interval < 35) {
        this.selectedTimeStep = 'Monthly'
      } else {
        this.selectedTimeStep = 'Yearly'
      }
    },
    // chunk functions
    getOtherChunks (numDaysBrush) {
      this.chunkDaysForRect = []
      let chunkBefore = false
      let chunkAfter = false
      let numDaysBeforeBrush = Math.round(Math.abs(this.brushExtent[0] - this.scalesxBrush.domain()[0]) / oneDay)
      let numDaysAfterBrush = Math.round(Math.abs(this.scalesxBrush.domain()[1] - this.brushExtent[1]) / oneDay)

      if (numDaysBrush < numDaysBeforeBrush) { chunkBefore = true }
      if (numDaysBrush < numDaysAfterBrush) { chunkAfter = true }

      let numYearsPerBrush = (Math.floor(numDaysBrush / 365) < 1) ? 1 : Math.floor(numDaysBrush / 365)
      let brushStartDay = this.brushExtent[0]

      let chunkCounterBefore = 1
      let chunkCounterAfter = 1
      this.chunksData = []
      this.chunkMeans = []

      let data = this.filledData.slice() // probably don't need

      if (chunkBefore) {
        let chunkStartDay = d3.timeYear.offset(brushStartDay, -numYearsPerBrush)
        let chunkEndDay = d3.timeDay.offset(chunkStartDay, numDaysBrush)
        let chunkStartDayOffset = d3.timeDay.count(chunkStartDay, brushStartDay)

        while (chunkStartDay > this.scalesxBrush.domain()[0]) {
          this.chunkDaysForRect.push({
            start: this.scalesxBrush(chunkStartDay),
            width: this.scalesxBrush(chunkEndDay) - this.scalesxBrush(chunkStartDay),
            beforeNotAfter: true
          })

          let cumulFilteredDate = this.getCumulFilteredDate(data, chunkStartDay, chunkEndDay, chunkCounterBefore)
          cumulFilteredDate.forEach(function (d, i) {
            d.date2 = d3.timeDay.offset(d.date, chunkStartDayOffset)
            d.beforeNotAfter = true
          })

          if (cumulFilteredDate.length > 0) {
            this.chunksData.push(cumulFilteredDate)
            this.chunkMeans.push({
              minYear: d3.min(cumulFilteredDate.map(d => d.date)),
              valueMean: d3.mean(cumulFilteredDate.map(d => d.value)),
              beforeNotAfter: true
            })
          }

          this.updateCumulAll(cumulFilteredDate)
          chunkCounterBefore++

          chunkStartDay = d3.timeYear.offset(brushStartDay, -numYearsPerBrush * chunkCounterBefore)
          chunkEndDay = d3.timeDay.offset(chunkStartDay, numDaysBrush)
          chunkStartDayOffset = d3.timeDay.count(chunkStartDay, brushStartDay)
        }
      }
      if (chunkAfter) {
        let chunkStartDay = d3.timeYear.offset(brushStartDay, numYearsPerBrush)
        let chunkEndDay = d3.timeDay.offset(chunkStartDay, numDaysBrush)
        let chunkStartDayOffset = d3.timeDay.count(brushStartDay, chunkStartDay)

        while (chunkEndDay < this.scalesxBrush.domain()[1]) {
          this.chunkDaysForRect.push({
            start: this.scalesxBrush(chunkStartDay),
            width: this.scalesxBrush(chunkEndDay) - this.scalesxBrush(chunkStartDay),
            beforeNotAfter: false
          })

          let cumulFilteredDate = this.getCumulFilteredDate(data, chunkStartDay, chunkEndDay, chunkCounterAfter)
          cumulFilteredDate.forEach(function (d, i) {
            d.date2 = d3.timeDay.offset(d.date, -chunkStartDayOffset)
            d.beforeNotAfter = false
          })

          if (cumulFilteredDate.length > 0) {
            this.chunksData.push(cumulFilteredDate)
            this.chunkMeans.push({
              minYear: d3.min(cumulFilteredDate.map(d => d.date)),
              valueMean: d3.mean(cumulFilteredDate.map(d => d.value)),
              beforeNotAfter: false
            })
          }

          this.updateCumulAll(cumulFilteredDate)

          chunkCounterAfter++

          chunkStartDay = d3.timeYear.offset(brushStartDay, numYearsPerBrush * chunkCounterAfter)
          chunkEndDay = d3.timeDay.offset(chunkStartDay, numDaysBrush)
          chunkStartDayOffset = d3.timeDay.count(brushStartDay, chunkStartDay)
        }
      }
      this.chunkCounters = [ chunkCounterBefore - 1, chunkCounterAfter - 1 ]
    },
    updateChunks () {
      let numDaysBrush = Math.round(Math.abs((this.brushExtent[1] - this.brushExtent[0]) / oneDay))
      let numDaysBeginningToBrush = Math.round(Math.abs((this.brushExtent[0] - this.scalesxBrush.domain()[0]) / oneDay))
      let numDaysBrushToEnd = Math.round(Math.abs((this.scalesxBrush.domain()[1] - this.brushExtent[1]) / oneDay))

      this.numChunks = 0

      if (numDaysBeginningToBrush > numDaysBrush || numDaysBrushToEnd > numDaysBrush) { // chunks before or after the brush
        this.getOtherChunks(numDaysBrush)

        this.maxOfMaxCumul = d3.max(this.maxCumulAll)
        this.minOfMinCumul = d3.min(this.minCumulAll)
        this.numChunks = this.chunkDaysForRect.length
      } else {
        this.maxOfMaxCumul = d3.max(this.maxCumulAll)
        this.minOfMinCumul = d3.min(this.minCumulAll)
        this.chunksData = []
        this.chunkDaysForRect = []
      }
    },
    updateFilterChunk () {
      this.filterDaysForRect = []
      this.filterDaysForRect.push({
        start: this.scalesxBrush(this.brushExtent[0]),
        width: this.scalesxBrush(this.brushExtent[1]) - this.scalesxBrush(this.brushExtent[0])
      })

      this.filterMean = { minYear: this.brushExtent[0], valueMean: d3.mean(this.brushedData.map(d => d.value)) }
    },
    updateCumulAll (d) {
      this.maxCumulAll.push(this.getMaxCumul(d))
      this.minCumulAll.push(this.getMinCumul(d))
    },
    emptyCumulAll () {
      this.maxCumulAll = []
      this.minCumulAll = []
    },
    getMaxCumul (dat) {
      return d3.max(dat, d => d.cumulValue)
    },
    getMinCumul (dat) {
      return d3.min(dat, d => d.cumulValue)
    },
    getCumulFilteredDate (dataIn, minDate, maxDate, chunkCounter) {
      let data = dataIn.slice() // make a copy
      let fDate = data.filter(d => d.date >= minDate && d.date <= maxDate)
      let values = fDate.map(d => d.value)
      let cumulValueArray = this.cumulSum(values)
      let fDateCumul = fDate.map((e, i) => ({ cumulValue: cumulValueArray[i], ...e }))

      return fDateCumul
    },
    cumulSum (a) {
      let result = [a[0]]

      for (let i = 1; i < a.length; i++) {
        result[i] = result[i - 1] + a[i]
      }
      return result
    }
  }
}
</script>

<style>
  .container {
    max-width: 984px;
  }
</style>
