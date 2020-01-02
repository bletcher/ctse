<template>
  <div class='means-chart'>
    <svg></svg>
    <v-overlay
      :absolute="true"
      :value="overlayValue"
    >
    </v-overlay>
  </div>
</template>

<script>
import * as d3 from 'd3'
import { regressionLinear } from 'd3-regression'
import { eventBus } from '../main'

export default {
  name: 'MeansChart',
  props: {
  },
  data: () => ({
    chunkMeans: [],
    filterMean: null,
    numChunks: null,
    svgMeans: null,
    means: null,
    widthMax: 960,
    heightMax: 400,
    margin: {
      top: 20,
      right: 50,
      bottom: 60,
      left: 40
    },
    axes: {
      y: null,
      x: null
    },
    overlayValue: true
  }),
  /*  watch: {
    'chunkMeans' () {
      this.initializeMeansChart()
    }
  }, */
  mounted () {
  },
  created () {
    eventBus.$on('updatedChunks', (d) => {
      this.chunkMeans = d.chunkMeans
      this.numChunks = d.numChunks
      this.filterMean = d.filterMean

      if (d.numChunks > 1) {
        this.overlayValue = false
        this.createMeansChart()
      } else {
        d3.select('.means-chart').selectAll('svg > *').remove()
        this.overlayValue = true
      }
    })
  },
  computed: {
    height () { return this.heightMax - this.margin.top - this.margin.bottom },
    width () { return this.widthMax - this.margin.left - this.margin.right }
  },
  methods: {
    createMeansChart () {
      this.chunkMeans.push(this.filterMean)

      d3.select('.means-chart').selectAll('svg > *').remove()
      this.svgMeans = d3.select('.means-chart').select('svg')
      this.svgMeans
        .attr('width', this.widthMax)
        .attr('height', this.heightMax)

      this.means = this.svgMeans.append('g')
        .attr('class', 'chunkmeans')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')

      const x = d3.scaleTime()
        .range([0, this.width])
        .domain(d3.extent(this.chunkMeans, d => d.minYear))
      const y = d3.scaleLinear()
        .range([this.height, 0])
        .domain(d3.extent(this.chunkMeans, d => d.valueMean))

      let circles = this.means.selectAll('circle')
        .data(this.chunkMeans)

      circles.enter()
        .append('circle')
        .attr('cx', d => x(d.minYear))
        .attr('cy', d => y(d.valueMean))
        .attr('r', 3)
        .attr('stroke', 'steelblue')
        .attr('fill', 'steelblue')

      circles.exit().remove()
      // ////////////////////////////////////

      let lrChunkMeans = regressionLinear()
        .x(d => d.minYear)
        .y(d => d.valueMean)

      let lr = lrChunkMeans(this.chunkMeans)

      this.means.selectAll('line').remove()

      this.means.append('line')
        .datum(lr)
        .attr('x1', d => x((d[0][0])))
        .attr('x2', d => x(d[1][0]))
        .attr('y1', d => y(d[0][1]))
        .attr('y2', d => y(d[1][1]))
        .attr('stroke', 'steelblue')
      // //////////////////////////////////////
      this.means.selectAll('.rSq').remove()

      this.means.append('text')
        .attr('class', 'rSq')
        .attr('x', this.width - 150)
        .attr('y', this.height - 20)
        .text('r-squared = ' + lr.rSquared.toFixed(2))
        .attr('font-family', 'sans-serif')

      this.means.exit().remove()

      this.means.select('.axis--yMeans').selectAll('.tick:last-of-type text').text('')
      this.axes.x = d3.axisBottom(x)

      this.axes.y = g => g
        .call(d3.axisLeft(y))
        .call(g => g.select('.tick:last-of-type text').clone()
          .attr('x', 6)
          .attr('text-anchor', 'start')
          // .attr('font-weight', 'bold')
          .text('Mean Temperature (C)'))

      this.means.append('g')
        .attr('class', 'axis axis--xMeans')
        .attr('transform', `translate(0, ${this.height})`)
        .call(this.axes.x)

      this.means.append('g')
        .attr('class', 'axis axis--yMeans')
        .call(this.axes.y)
    },
    dateParseY () {
      return d3.timeFormat('%j')
    }
  }
}
</script>
