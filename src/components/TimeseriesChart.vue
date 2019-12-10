<template>
  <div class="timeseries-chart">
    <svg width="960" height="600"></svg>
  </div>
</template>

<script>
import * as d3 from 'd3'

export default {
  name: 'TimeseriesChart',
  props: {
    data: {
      type: Array,
      required: false,
      defaults: () => []
    }
  },

  data: () => ({
    svg: d3.select('svg'),
    widthMax: 960,
    heightMax: 600,
    margin: { top: 20, right: 50, bottom: 20, left: 40 },
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
    }
  }),
  mounted () {
    // this.initializeTimeSeriesChart()
  },
  watch: {
    'data' () {
      this.initializeTimeSeriesChart()
    }
  },
  computed: {
    width () { return this.widthMax - this.margin.left - this.margin.right },
    height () { return this.heightMax - this.margin.top - this.margin.bottom }

  },
  methods: {
    initializeTimeSeriesChart () {
      console.log('initializeTimeseriesChart:start', this.data)
      this.scales.x = d3.scaleTime().range([0, this.width])
      this.scales.y = d3.scaleLinear().range([this.height, 0])
      this.scales.xCFD = d3.scaleTime().range([0, this.width])
      this.scales.yCFD = d3.scaleLinear().range([this.height, 0])

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

      this.scales.x.domain(d3.extent(this.data, d => d.date))
      this.scales.y.domain(d3.extent(this.data, d => d.value)).nice()

      this.svgElements.focus = this.svg.append('g')
        .attr('class', 'focus')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')

      console.log('initializeTimeSeriesChart:end', this.scales, this.svgElements)
    },
    line: d3.line()
      .defined(d => !isNaN(d.value))
      .x(d => this.scales.x(d.date))
      .y(d => this.scales.y(d.value)),
    lineCFD: d3.line()
      .defined(d => !isNaN(d.value))
      .x(d => this.scales.x(d.date))
      .y(d => this.scales.yCFD(d.cumulValue))
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
