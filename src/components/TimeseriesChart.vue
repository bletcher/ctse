<template>
  <div class='timeseries-chart'>
    <svg></svg>
  </div>
</template>

<script>
import * as d3 from 'd3'
import { eventBus } from '../main'

export default {
  name: 'TimeseriesChart',
  props: {
    filledData: {
      type: Array,
      required: false,
      defaults: () => []
    },
    extent: {
      type: Array,
      required: false,
      defaults: () => []
    }
  },

  data: () => ({
    svg: null,
    widthMax: 960,
    heightMax: 400,
    margin: {
      top: 20,
      right: 50,
      bottom: 20,
      left: 40
    },
    scales: {
      x: null,
      y: null,
      xCFD: null,
      yCFD: null,
      xBrush: null
    },
    axes: {
      y: null,
      x: null,
      yCFD: null
    },
    svgElements: {
      focus: null
    },
    chartElements: {
      dot: null
    },
    brushedData: [],
    dataFilledCFD: [],
    minCumulAll: [],
    minOfMinCumul: null,
    maxCumulAll: [],
    maxOfMaxCumul: null,
    filterDaysForRect: [],
    oneDay: 24 * 60 * 60 * 1000,
    numChunks: null,
    chunkCounters: null,
    chunkDaysForRect: [],
    chunksData: [],
    chunkMeans: []
  }),
  mounted () {
    // this.initializeTimeSeriesChart()
  },
  watch: {
    'filledData' () {
      this.initializeTimeSeriesChart()
    },
    'extent' () {
      this.updateTimeseriesChart()
    }
  },
  computed: {
    width () { return this.widthMax - this.margin.left - this.margin.right },
    height () { return this.heightMax - this.margin.top - this.margin.bottom }
  },
  methods: {
    initializeTimeSeriesChart () {
      console.log('initializeTimeseriesChart:start', this.filledData)

      d3.select('.timeseries-chart').selectAll('svg > *').remove()
      this.svg = d3.select('.timeseries-chart').select('svg')
      this.svg
        .attr('width', this.widthMax)
        .attr('height', this.heightMax)

      this.scales.x = d3.scaleTime().range([0, this.width])
      this.scales.y = d3.scaleLinear().range([this.height, 0])
      this.scales.xCFD = d3.scaleTime().range([0, this.width])
      this.scales.yCFD = d3.scaleLinear().range([this.height, 0])
      this.scales.xBrush = d3.scaleTime().range([0, this.width])

      this.scales.x.domain(d3.extent(this.filledData, d => d.date))
      this.scales.y.domain(d3.extent(this.filledData, d => d.value)).nice()
      this.scales.xCFD.domain(d3.extent(this.filledData, d => d.date))
      this.scales.yCFD.domain(d3.extent(this.filledData, d => d.value)).nice()
      this.scales.xBrush.domain(d3.extent(this.filledData, d => d.date))

      this.axes.x = d3.axisBottom(this.scales.x).ticks(this.width / 80).tickSizeOuter(0)

      this.axes.y = g => g
        .call(d3.axisLeft(this.scales.y))
        .call(g => g.select('.tick:last-of-type text').clone()
          .attr('x', 6)
          .attr('text-anchor', 'start')
          // .attr('font-weight', 'bold')
          .text('Temperature (C)'))

      this.axes.yCFD = g => g
        .call(d3.axisRight(this.scales.yCFD))
        .call(g => g.select('.tick:last-of-type text').clone()
          .attr('x', -6)
          .attr('text-anchor', 'end')
        // .attr('font-weight', 'bold')
          .text('Cumulative Temperature (C)'))
        // .call(cons)

      this.svg.append('defs').append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('width', this.width)
        .attr('height', this.height)

      this.svgElements.focus = this.svg.append('g')
        .attr('class', 'focus')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')

      /*
      this.svgElements.focus.append('rect')
        .attr('class', 'zoom')
        .attr('width', this.width)
        .attr('height', this.height)
        // .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        // .call(zoom)
      */
      this.chartElements.dot = this.svgElements.focus.append('g')
        .attr('class', 'dot')
        .attr('display', 'none')

      this.chartElements.dot.append('circle')
        .attr('r', 2.5)

      this.chartElements.dot.append('text')
        .style('font', '12px sans-serif')
        .attr('text-anchor', 'middle')
        .attr('y', -10)

      // from append to focus
      this.svgElements.focus.append('path')
        .datum(this.filledData)
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1.5)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', this.line(this.scales))

      this.svgElements.focus.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', 'translate(0,' + this.height + ')')
        .call(this.axes.x)

      this.svgElements.focus.append('g')
        .attr('class', 'axis axis--y')
        .call(this.axes.y)

      this.svgElements.focus.append('path')
        .datum(this.filledData)
        .attr('class', 'lineCFD')
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 3.5)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', this.lineCFD(this.scales))

      this.svgElements.focus.append('g')
        .attr('class', 'axis axis--yCFD')
        .attr('transform', `translate(${this.width},0)`)
        .call(this.axes.yCFD)

      this.svgElements.focus.append('g')
        .attr('class', 'lineChunks')
        .attr('fill', 'none')
        .attr('stroke-width', 1.0)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke-opacity', 0.6)

      console.log('initializeTimeSeriesChart:end')
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
    },
    line (scales) {
      return d3.line()
        .defined(d => !isNaN(d.value))
        .x(d => scales.x(d.date))
        .y(d => scales.y(d.value))
    },
    lineCFD (scales) {
      return d3.line()
        .defined(d => !isNaN(d.value))
        .x(d => scales.x(d.date))
        .y(d => scales.yCFD(d.cumulValue))
    },
    enteredLineCFD (d, i, n) {
      d3.select(n[i])
        .attr('stroke-width', 5)
        .attr('stroke-opacity', 1)
        // .moveToFront()

      d3.select('.filterRect').selectAll('rect')
        .attr('height', 5)
        // .moveToFront()
    },
    leftLineCFD (d, i, n) {
      d3.select(n[i])
        .attr('stroke-width', 2.5)
        .attr('stroke-opacity', 0.6)

      d3.select('.filterRect').selectAll('rect')
        .attr('height', 2.5)
    },
    lineChunks (scales) {
      return d3.line()
        .defined(d => !isNaN(d.value))
        .x(d => scales.x(d.date2))
        .y(d => scales.yCFD(d.cumulValue))
    },
    moved (d) {
      let xPos = this.scales.x.invert(d3.event.offsetX - this.margin.left)
      // let yPos = this.scales.yCFD.invert(d3.event.layerY)
      let i0 = d3.bisectLeft(d.map(dd => dd.date2), xPos, 1) - 1

      let parseDateY = d3.timeFormat('%Y')
      let minYear = parseDateY(d3.min(d.map(dd => dd.date)))

      this.chartElements.dot.attr('transform', `translate(${this.scales.x(d[i0].date2)},${this.scales.yCFD(d[i0].cumulValue)})`) // .moveToFront()
      this.chartElements.dot.select('text').text(minYear) // .moveToFront()
    },
    updateTimeseriesChart () {
      console.log('updateTimeseriesChart:start')
      this.scales.x.domain(this.extent)
      this.brushedData = this.getCumulFilteredDate(this.filledData, this.extent[0], this.extent[1])
      this.scales.y.domain(d3.extent(this.brushedData, d => d.value)).nice()

      this.emptyCumulAll()
      this.updateCumulAll()
      this.updateFilterChunk() // change name of this to updateDaysForRect
      this.updateChunks()
      this.render()

      console.log('updateTimeseriesChart:end')
    },
    updateCumulAll () {
      this.maxCumulAll.push(this.getMaxCumul(this.brushedData))
      this.minCumulAll.push(this.getMinCumul(this.brushedData))
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
    updateFilterChunk () {
      this.filterDaysForRect = []
      this.filterDaysForRect.push({
        start: this.scales.xBrush(this.extent[0]),
        width: this.scales.xBrush(this.extent[1]) - this.scales.xBrush(this.extent[0])
      })
    },
    updateChunks () {
      console.log('updateChunks:start')
      // let numDaysX2 = Math.round(Math.abs((x2.domain()[1] - x2.domain()[0]) / this.oneDay))
      let numDaysBrush = Math.round(Math.abs((this.extent[1] - this.extent[0]) / this.oneDay))
      let numDaysBeginningToBrush = Math.round(Math.abs((this.extent[0] - this.scales.xBrush.domain()[0]) / this.oneDay))
      let numDaysBrushToEnd = Math.round(Math.abs((this.scales.xBrush.domain()[1] - this.extent[1]) / this.oneDay))

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
    getOtherChunks (numDaysBrush) {
      console.log('getOtherChunks:start', numDaysBrush)
      this.chunkDaysForRect = []
      let chunkBefore = false
      let chunkAfter = false
      let numDaysBeforeBrush = Math.round(Math.abs(this.extent[0] - this.scales.xBrush.domain()[0]) / this.oneDay)
      let numDaysAfterBrush = Math.round(Math.abs(this.scales.xBrush.domain()[1] - this.extent[1]) / this.oneDay)

      if (numDaysBrush < numDaysBeforeBrush) { chunkBefore = true }
      if (numDaysBrush < numDaysAfterBrush) { chunkAfter = true }

      let numYearsPerBrush = (Math.floor(numDaysBrush / 365) < 1) ? 1 : Math.floor(numDaysBrush / 365)
      let brushStartDay = this.extent[0]

      let chunkCounterBefore = 1
      let chunkCounterAfter = 1
      this.chunksData = []
      this.chunkMeans = []

      let data = this.filledData.slice() // probably don't need

      if (chunkBefore) {
        let chunkStartDayOffset = -365 * numYearsPerBrush * 1
        let chunkStartDay = d3.timeDay.offset(brushStartDay, chunkStartDayOffset)
        let chunkEndDay = d3.timeDay.offset(chunkStartDay, numDaysBrush)

        while (chunkStartDay > this.scales.xBrush.domain()[0]) {
          this.chunkDaysForRect.push({
            start: this.scales.xBrush(chunkStartDay),
            width: this.scales.xBrush(chunkEndDay) - this.scales.xBrush(chunkStartDay),
            beforeNotAfter: true
          })

          let cumulFilteredDate = this.getCumulFilteredDate(data, chunkStartDay, chunkEndDay, chunkCounterBefore)
          cumulFilteredDate.forEach(function (d, i) {
            d.date2 = d3.timeDay.offset(d.date, -chunkStartDayOffset)
            d.beforeNotAfter = true
          })

          if (cumulFilteredDate.length > 0) {
            this.chunksData.push(cumulFilteredDate)
            this.chunkMeans.push({
              minYear: d3.min(cumulFilteredDate.map(d => d.date)),
              valueMean: d3.mean(cumulFilteredDate.map(d => d.value))
            })
          }

          this.updateCumulAll(cumulFilteredDate)

          chunkCounterBefore++

          chunkStartDayOffset = -365 * numYearsPerBrush * chunkCounterBefore
          chunkStartDay = d3.timeDay.offset(brushStartDay, chunkStartDayOffset)
          chunkEndDay = d3.timeDay.offset(chunkStartDay, numDaysBrush)
        }
      }

      if (chunkAfter) {
        let chunkStartDayOffset = 365 * numYearsPerBrush * 1
        let chunkStartDay = d3.timeDay.offset(brushStartDay, chunkStartDayOffset)
        let chunkEndDay = d3.timeDay.offset(chunkStartDay, numDaysBrush)

        while (chunkEndDay < this.scales.xBrush.domain()[1]) {
          this.chunkDaysForRect.push({
            start: this.scales.xBrush(chunkStartDay),
            width: this.scales.xBrush(chunkEndDay) - this.scales.xBrush(chunkStartDay),
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
              valueMean: d3.mean(cumulFilteredDate.map(d => d.value))
            })
          }

          this.updateCumulAll(cumulFilteredDate)

          chunkCounterAfter++

          chunkStartDayOffset = 365 * numYearsPerBrush * chunkCounterAfter
          chunkStartDay = d3.timeDay.offset(brushStartDay, chunkStartDayOffset)
          chunkEndDay = d3.timeDay.offset(chunkStartDay, numDaysBrush)
        }
      }
      this.chunkCounters = [ chunkCounterBefore - 1, chunkCounterAfter - 1 ]
    },
    render () {
      this.updateYCFD()
      this.renderLineChunks()
      eventBus.emitChunks({
        chunksData: this.chunksData,
        chunkDaysForRect: this.chunkDaysForRect,
        filterDaysForRect: this.filterDaysForRect,
        chunkCounters: this.chunkCounters,
        numChunks: this.numChunks })
      // this.updateFilterRect()
      // this.updateChunkRects()
      this.updateAxes() // (dat, from)
      this.updateLines()
    },
    updateYCFD () {
      this.scales.yCFD.domain([this.minOfMinCumul, this.maxOfMaxCumul]).nice()
    },
    renderLineChunks () {
      console.log('renderLineChunks:start')
      let lines = this.svgElements.focus.select('.lineChunks').selectAll('path')
        .data(this.chunksData)

      lines.enter()
        .append('path')

      lines
        .attr('fill', 'none')
        .attr('stroke', this.colorChunkLines)
        .attr('stroke-width', 2.5)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', this.lineChunks(this.scales))
        .on('mousemove', this.moved)
        .on('mouseenter', this.enteredChunkLine)
        .on('mouseleave', this.leftChunkLine)

      lines.exit().remove()
      console.log('renderLineChunks:end')
    },
    enteredChunkLine (d, i, n) {
      d3.select(n[i])
        .attr('stroke-width', 5)
        .attr('stroke-opacity', 0.6)

      this.chartElements.dot.attr('display', null)
      let rectFiltered = this.getRectFromPath(n[i])
      d3.select(rectFiltered)
        .attr('height', 5)
    },
    leftChunkLine (d, i, n) {
      d3.select(n[i])
        .attr('stroke-width', 2.5)
        .attr('stroke-opacity', 0.6)

      this.chartElements.dot.attr('display', 'none')

      let rectFiltered = this.getRectFromPath(n[i])
      d3.select(rectFiltered)
        .attr('height', 2.5)
        // .moveToFront()
    },
    getRectFromPath (path) {
      let rects = d3.select('.chunkRects').selectAll('rect').nodes()
      let pathStroke = d3.select(path).attr('stroke')
      let rectsF = rects.filter(function (d) { return d3.select(d).attr('fill') === pathStroke })
      return rectsF[0]
    },
    colorChunkLines (d, i) {
      if (d[0].beforeNotAfter) {
        let r = d3.range(0, this.chunkCounters[0]) // reverse the order because before chunks are counted from right to left
        return d3.interpolateViridis(r[this.chunkCounters[0] - i - 1] / this.numChunks)
      } else {
        return d3.interpolateViridis(i / this.numChunks)
      }
    },
    updateAxes () {
      // if(from == 'brushed') {
      this.svgElements.focus.select('.axis--x').call(this.axes.x)
      this.svgElements.focus.select('.axis--yCFD').selectAll('.tick:last-of-type text').text('')
      this.svgElements.focus.select('.axis--yCFD').call(this.scales.yCFD)
      //      this.svgElements.focus.select('.zoom').call(zoom.transform, d3.zoomIdentity
      //        .scale(this.width / (this.extent[1] - this.extent[0]))
      //        .translate(-this.extent[0], 0))

      // means.select('.axis--xMeans').call(xAxisMeans);
      // means.select('.axis--yMeans').selectAll('.tick:last-of-type text').text('')
      // means.select('.axis--yMeans').call(yAxisMeans);
    /*    }
    else if (from == 'zoomed') {
      focus.select('.axis--x').call(xAxis)
      focus.select('.axis--yCFD').selectAll('.tick:last-of-type text').text('')
      focus.select('.axis--yCFD').call(yAxisCFD)
      context.select('.brush').call(brush.move, x.range().map(dat.invertX, dat))

      //means.select('.axis--xMeans').call(xAxisMeans);
      //means.select('.axis--yMeans').selectAll('.tick:last-of-type text').text('')
      //means.select('.axis--yMeans').call(yAxisMeans);
    */
    },
    updateLines () {
      this.svgElements.focus.select('.line')
        .datum(this.brushedData)
        .attr('d', this.line(this.scales))

      this.svgElements.focus.select('.lineCFD')
        .datum(this.brushedData)
        .attr('d', this.lineCFD(this.scales))
        .on('mouseenter', this.enteredLineCFD)
        .on('mouseleave', this.leftLineCFD)
    },
    'd3.selection.prototype.moveToFront': function () {
      return this.each(function () {
        this.parentNode.appendChild(this)
      })
    }
  }
}
</script>

<style scoped>
/*  .timeseries-chart {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
    }
*/
</style>
