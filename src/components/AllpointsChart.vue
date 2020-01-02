<template>
  <div class='allpoints-chart'>
    <svg></svg>
  </div>
</template>

<script>
import * as d3 from 'd3'

export default {
  name: 'AllpointsChart',
  props: {
    dataByDay: {
      type: Array,
      required: false,
      defaults: () => []
    },
    dataByDayOfYear: {
      type: Array,
      required: false,
      defaults: () => []
    }
  },
  data: () => ({
    svg: null,
    widthMax: 960,
    heightMax: 500,
    margin: {
      top: 20,
      right: 50,
      bottom: 20,
      left: 40
    }
  }),
  mounted () {
    this.initializeAllPointsChart()
  },
  watch: {
    'dataByDayOfYear' () {
      console.log('AllpointsChart:watch.dataByDayOfYear')
      this.initializeAllPointsChart()
    }
  },
  computed: {
    height () { return this.heightMax - this.margin.top - this.margin.bottom },
    width () { return this.widthMax - this.margin.left - this.margin.right }
  },
  methods: {
    initializeAllPointsChart () {
      const parseDate = d3.timeParse('%B %d, %Y')
      const julian = d3.timeFormat('%j')

      for (let i = 0; i < this.dataByDay.length; i++) {
        this.dataByDay[i].dayOfYear = +julian(parseDate(this.dataByDay[i].key))
      }

      d3.select('.allpoints-chart').selectAll('svg > *').remove()
      let svgAllPoints = d3.select('.allpoints-chart').select('svg')
        .attr('width', this.width)
        .attr('height', this.height)

      svgAllPoints.append('g')
        .attr('class', 'allpoints')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')

      let y = d3.scaleLinear()
        .range([this.height, 0])
        .domain(d3.extent(this.dataByDay, d => d.value))
      let x = d3.scaleLinear()
        .range([0, this.width])
        .domain(d3.extent(this.dataByDay, d => d.dayOfYear)).nice()

      let circles = d3.select('.allpoints').selectAll('circle')
        .data(this.dataByDay)
        .enter()
        .append('circle')

      circles
        .attr('cx', d => x(d.dayOfYear))
        .attr('cy', d => y(d.value))
        .attr('r', 1)
        .attr('stroke', 'steelblue')

      let line = d3.line()
        .x(d => +x(d.key))
        .y(d => y(d.movingMean))
        .curve(d3.curveCatmullRom.alpha(1.0))

      d3.select('.allpoints').append('path')
        .datum(this.dataByDayOfYear)
        .attr('class', 'spline')
        .attr('fill', 'none')
        .attr('stroke', 'orange')
        .attr('stroke-width', 3.5)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', line)
    }
  }
}

</script>
