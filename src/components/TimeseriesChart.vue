<template>
  <div class='timeseries-chart'>
    <svg></svg>
  </div>
</template>

<script>
import * as d3 from 'd3'

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
    },
    selectedDepVar: {
      type: String,
      required: false,
      defaults: () => ''
    },
    dataFilledCFD: {
      type: Array,
      required: false,
      defaults: () => []
    },
    filledDataExtentDate: {
      type: Array,
      required: false,
      defaults: () => []
    },
    filledDataExtentValue: {
      type: Array,
      required: false,
      defaults: () => []
    },
    brushedData: {
      type: Array,
      required: false,
      defaults: () => []
    },
    filterDaysForRect: {
      type: Array,
      required: false,
      defaults: () => []
    },
    numChunks: {
      type: Number,
      required: false,
      defaults: () => null
    },
    chunksData: {
      type: Array,
      required: false,
      defaults: () => null
    },
    chunkCounters: {
      type: Array,
      required: false,
      defaults: () => []
    },
    minOfMinCumul: {
      type: Number,
      required: false,
      defaults: () => null
    },
    maxOfMaxCumul: {
      type: Number,
      required: false,
      defaults: () => null
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
    filterMean: null
  }),
  mounted () {
    this.initializeTimeSeriesChart()
    this.updateTimeseriesChart()
  },
  watch: {
    'filledData' () {
      this.initializeTimeSeriesChart()
    },
    'extent' () {
      this.updateTimeseriesChart()
    },
    'selectedDepVar' () {
      this.updateTimeseriesChart()
    }
  },
  computed: {
    width () { return this.widthMax - this.margin.left - this.margin.right },
    height () { return this.heightMax - this.margin.top - this.margin.bottom }
  },
  methods: {
    initializeTimeSeriesChart () {
      console.log('initializeTimeseriesChart:start')

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

      this.scales.x.domain(this.filledDataExtentDate)
      this.scales.y.domain(this.filledDataExtentValue).nice()
      this.scales.xCFD.domain(this.filledDataExtentDate)
      this.scales.xBrush.domain(this.filledDataExtentDate)

      this.scales.yCFD.domain(d3.extent(this.dataFilledCFD, d => d.cumulValue)).nice()

      this.axes.x = d3.axisBottom(this.scales.x).ticks(this.width / 80).tickSizeOuter(0)

      this.axes.y = g => g
        .call(d3.axisLeft(this.scales.y))
        .call(g => g.select('.tick:last-of-type text').clone()
          .attr('x', 6)
          .attr('text-anchor', 'start')
          // .attr('font-weight', 'bold')
          .attr('fill', 'steelblue')
          .text(this.selectedDepVar)
        )

      this.axes.yCFD = g => g
        .call(d3.axisRight(this.scales.yCFD))
        .call(g => g.select('.tick:last-of-type text').clone()
          .attr('x', -6)
          .attr('text-anchor', 'end')
        // .attr('font-weight', 'bold')
          .attr('fill', 'red')
          .text('Cumulative ' + this.selectedDepVar)
        )

      this.svgElements.focus = this.svg.append('g')
        .attr('class', 'focus')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')

      this.chartElements.dot = this.svgElements.focus.append('g')
        .attr('class', 'dot')
        .attr('display', 'none')

      this.chartElements.dot.append('circle')
        .attr('r', 5)

      this.chartElements.dot.append('text')
        .style('font', '16px sans-serif')
        .attr('text-anchor', 'middle')
        .attr('y', -10)

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
    },
    updateTimeseriesChart () {
      this.scales.x.domain(this.extent)
      this.scales.y.domain(d3.extent(this.brushedData, d => d.value)).nice()

      this.render()
    },
    render () {
      this.updateYCFD()
      this.renderLineChunks()
      this.updateAxes()
      this.updateLines()
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
      n[i].parentNode.appendChild(n[i]) // move to front

      d3.select(n[i])
        .attr('stroke-width', 5)
        .attr('stroke-opacity', 1)

      d3.select('.filterRect').selectAll('rect')
        .attr('height', 5)
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
    updateYCFD () {
      this.scales.yCFD.domain([this.minOfMinCumul, this.maxOfMaxCumul]).nice()
    },
    renderLineChunks () {
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
        .on('mousemove', this.plotDot)
        .on('mouseenter', this.enteredChunkLine)
        .on('mouseleave', this.leftChunkLine)

      lines.exit().remove()
    },
    plotDot (d) {
      let xPos = this.scales.x.invert(d3.event.offsetX - this.margin.left)
      let i0 = d3.bisectLeft(d.map(dd => dd.date2), xPos, 1) - 1

      let parseDateY = d3.timeFormat('%Y')
      let medianYear = parseDateY(d3.median(d.map(dd => dd.date)))

      this.chartElements.dot.attr('display', null)
      this.chartElements.dot.attr('transform', `translate(${this.scales.x(d[i0].date2)},${this.scales.yCFD(d[i0].cumulValue)})`)
      this.chartElements.dot.node().parentNode.appendChild(this.chartElements.dot.node()) // move to front
      this.chartElements.dot.select('text').text(medianYear)
    },
    enteredChunkLine (d, i, n) {
      n[i].parentNode.appendChild(n[i]) // move to front

      d3.select(n[i])
        .attr('stroke-width', 5)
        .attr('stroke-opacity', 1)

      this.plotDot(d)

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
    },
    getRectFromPath (path) {
      let rects = d3.select('.chunkRects').selectAll('rect').nodes()
      let pathStroke = d3.select(path).attr('stroke')
      let rectsF = rects.filter(function (d) { return d3.select(d).attr('fill') === pathStroke })
      return rectsF[0]
    },
    colorChunkLines (d, i) {
      if (d.beforeNotAfter) {
        let r = d3.range(0, this.chunkCounters[0]) // reverse the order because before chunks are counted from right to left
        return d3.interpolateViridis(r[this.chunkCounters[0] - i - 1] / this.numChunks)
      } else {
        return d3.interpolateViridis(i / this.numChunks)
      }
    },
    updateAxes () {
      this.svgElements.focus.select('.axis--x').call(this.axes.x)
      this.svgElements.focus.select('.axis--y').selectAll('.tick:last-of-type text').text('')
      this.svgElements.focus.select('.axis--y').call(this.axes.y)
      this.svgElements.focus.select('.axis--yCFD').selectAll('.tick:last-of-type text').text('')
      this.svgElements.focus.select('.axis--yCFD').call(this.axes.yCFD)
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
