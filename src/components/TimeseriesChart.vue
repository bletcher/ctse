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
      yCFD: null
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
    }
  }),
  mounted () {
    // this.initializeTimeSeriesChart()
  },
  watch: {
    'filledData' () {
      this.initializeTimeSeriesChart()
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

      this.scales.x.domain(d3.extent(this.filledData, d => d.date))
      this.scales.y.domain(d3.extent(this.filledData, d => d.value)).nice()
      this.scales.xCFD.domain(d3.extent(this.filledData, d => d.date))
      this.scales.yCFD.domain(d3.extent(this.filledData, d => d.value)).nice()

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

      let dataFilledCFD = this.getCumulFilteredDate(this.filledData, this.scales.x.domain()[0], this.scales.x.domain()[1])
      let maxCFD = d3.max(dataFilledCFD, d => d.cumulValue)
      let minCFD = d3.min(dataFilledCFD, d => d.cumulValue)
      this.scales.yCFD.domain([minCFD, maxCFD]).nice()

      this.svgElements.focus.append('path')
        .datum(dataFilledCFD)
        .attr('class', 'lineCFD')
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 3.5)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', this.lineCFD(this.scales))
        .on('mouseenter', function () {
          d3.select(this)
            .attr('stroke-width', 5)
            .attr('stroke-opacity', 1)
            // .'()
        })
        .on('mouseleave', function () {
          d3.select(this)
            .attr('stroke-width', 2.5)
            .attr('stroke-opacity', 1)
        })

      this.svgElements.focus.append('g')
        .attr('class', 'axis axis--yCFD')
        .attr('transform', `translate(${this.width},0)`)
        .call(this.axes.yCFD)

      console.log('initializeTimeSeriesChart:end')
    },
    updateTimeseriesChart () {
      console.log('initializeTimeseriesChart:start', this.filledData)
      // this.scales.x.domain(d3.extent(this., d => d.date))
      // this.scales.y.domain(d3.extent(this., d => d.value)).nice()

      console.log('initializeTimeseriesChart:end')
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
      d3.select(n)
        .attr('stroke-width', 5)
        .attr('stroke-opacity', 1)
        .moveToFront()

      // d3.select('.filterRect').selectAll('rect')
      //   .attr('height', 5)
      //   .'()
    },
    leftLineCFD () {
      d3.select(this)
        .attr('stroke-width', 2.5)
        .attr('stroke-opacity', 1)

      // d3.select('.filterRect').selectAll('rect')
      //   .attr('height', 2.5)

    // ' () {
    //   return this.each(function () {
    //    this.parentNode.appendChild(this)
    //  })
    },
    moved (d) {
      let xPos = this.scales.x.invert(d3.event.layerX - this.margin.left)
      // let yPos = this.scales.yCFD.invert(d3.event.layerY)
      let i0 = d3.bisectLeft(d.map(dd => dd.date2), xPos, 1) - 1

      let parseDateY = d3.timeFormat('%Y')
      let minYear = parseDateY(d3.min(d.map(dd => dd.date)))

      this.chartElements.dot.attr('transform', `translate(${this.scales.x(d[i0].date2)},${this.scales.yCFD(d[i0].cumulValue)})`) // .moveToFront()
      this.chartElements.dot.select('text').text(minYear) // .moveToFront()
    }
  }
}

</script>

<style scoped>
  .timeseries-chart {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
    }
</style>
