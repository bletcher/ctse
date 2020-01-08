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
    heightMax: 400,
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
      // console.log('AllpointsChart:watch.dataByDayOfYear')
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
        this.dataByDay[i].year = +this.dataByDay[i].key.slice(-4)
      }

      let minYear = d3.min(this.dataByDay.map(d => d.year))
      let maxYear = d3.max(this.dataByDay.map(d => d.year))

      d3.select('.allpoints-chart').selectAll('svg > *').remove()
      let svgAllPoints = d3.select('.allpoints-chart').select('svg')
        .attr('width', this.widthMax)
        .attr('height', this.heightMax)

      svgAllPoints.append('g')
        .attr('class', 'allpoints')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')

      let y = d3.scaleLinear()
        .range([this.height, 0])
        .domain(d3.extent(this.dataByDay, d => d.value)).nice()
      let x = d3.scaleLinear()
        .range([0, this.width])
        .domain(d3.extent(this.dataByDay, d => d.dayOfYear))

      let axisX = g => g
        .call(d3.axisBottom(x))
        .call(g => g.select('.tick:last-of-type text').clone()
          .attr('x', 20)
          .attr('text-anchor', 'start')
          .text('Day of year'))

      let axisY = g => g
        .call(d3.axisLeft(y))
        .attr('transform', `translate(${this.margin.left}, ${this.margin.bottom})`)
        .call(g => g.select('.tick:last-of-type text').clone()
          .attr('x', 6)
          .attr('text-anchor', 'start')
          .text('Temperature (C)'))

      svgAllPoints.append('g')
        .attr('class', 'axis axis--xAll')
        .attr('transform', `translate(${this.margin.left}, ${this.height + this.margin.bottom})`)
        .call(axisX)

      svgAllPoints.append('g')
        .attr('class', 'axis axis--yAll')
        .call(axisY)

      let circles = d3.select('.allpoints').selectAll('circle')
        .data(this.dataByDay)
        .enter()
        .append('circle')

      circles
        .attr('cx', d => x(d.dayOfYear))
        .attr('cy', d => y(d.value))
        .attr('r', 1)
        .attr('stroke', function (d) {
          let scaledYear = (d.year - minYear) / (maxYear - minYear)
          return d3.interpolateViridis(scaledYear)
        })

      let line = d3.line()
        .x(d => +x(d.key))
        .y(d => y(d.movingMean))
        .curve(d3.curveCatmullRom.alpha(1.0))

      if (this.dataByDayOfYear.length > 360) { // If have daily data (not passing selectedTimeStep for now)
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

      // define linear gradient legend
      let defs = svgAllPoints.append('defs')
      var linearGradient = defs.append('linearGradient')
        .attr('id', 'linear-gradient')

      linearGradient
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%')

      linearGradient.selectAll('stop')
        .data([
          { offset: '0%', color: d3.interpolateViridis(0) },
          { offset: '12.5%', color: d3.interpolateViridis(0.125) },
          { offset: '25%', color: d3.interpolateViridis(0.25) },
          { offset: '37.5%', color: d3.interpolateViridis(0.375) },
          { offset: '50%', color: d3.interpolateViridis(0.5) },
          { offset: '62.5%', color: d3.interpolateViridis(0.625) },
          { offset: '75%', color: d3.interpolateViridis(0.75) },
          { offset: '87.5%', color: d3.interpolateViridis(0.875) },
          { offset: '100%', color: d3.interpolateViridis(1) }
        ])
        .enter().append('stop')
        .attr('offset', function (d) { return d.offset })
        .attr('stop-color', function (d) { return d.color })

      svgAllPoints.append('rect')
        .attr('width', 200)
        .attr('height', 10)
        .attr('x', '710px')
        .attr('y', '5px')
        .style('fill', 'url(#linear-gradient)')

      svgAllPoints.append('text')
        .attr('x', '710px')
        .attr('y', '25px')
        .attr('font-size', '10')
        .text(minYear)

      svgAllPoints.append('text')
        .attr('x', '888px')
        .attr('y', '25px')
        .attr('font-size', '10')
        .text(maxYear)
    }
  }
}

</script>
