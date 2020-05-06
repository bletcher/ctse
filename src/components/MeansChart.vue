<template>
  <div class='means-chart'>
    <svg></svg>
    <v-overlay
      :absolute="true"
      :value="overlayValue"
    >
      Means chart not shown for less than 3 time periods
    </v-overlay>
  </div>
</template>

<script>
import * as d3 from 'd3'
import { regressionLinear } from 'd3-regression'

export default {
  name: 'MeansChart',
  props: {
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
    chunkMeans: {
      type: Array,
      required: false,
      defaults: () => []
    },
    numChunks: {
      type: Number,
      required: false,
      defaults: () => null
    },
    filterMean: {
      type: Object,
      required: false,
      defaults: () => {}
    },
    chunkCounters: {
      type: Array,
      required: false,
      defaults: () => []
    }
  },
  data: () => ({
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
    scales: {
      x: null,
      y: null
    },
    overlayValue: true
  }),
  mounted () {
    console.log('mounted:meansChart')
    if (this.numChunks > 1) {
      this.overlayValue = false
      this.initializeMeansChart()
      this.updateMeansChart()
    } else {
      d3.select('.means-chart').selectAll('svg > *').remove()
      this.overlayValue = true
    }
  },
  created () {
    console.log('created:meansChart')
  },
  watch: {
    'extent' () {
      if (this.numChunks > 1) {
        this.overlayValue = false
        this.initializeMeansChart()
        this.updateMeansChart()
      } else {
        d3.select('.means-chart').selectAll('svg > *').remove()
        this.overlayValue = true
      }
    },
    'selectedDepVar' () {
      this.updateMeansChart()
    }
  },
  computed: {
    height () { return this.heightMax - this.margin.top - this.margin.bottom },
    width () { return this.widthMax - this.margin.left - this.margin.right }
  },
  methods: {
    initializeMeansChart () {
      console.log('initializeMeansChart:start')
      this.scales.x = d3.scaleTime().range([0, this.width])
      this.scales.y = d3.scaleLinear().range([this.height, 0])

      d3.select('.means-chart').selectAll('svg > *').remove()

      this.svgMeans = d3.select('.means-chart').select('svg')
      this.svgMeans
        .attr('width', this.widthMax)
        .attr('height', this.heightMax)

      this.means = this.svgMeans.append('g')
        .attr('class', 'chunkmeans')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')

      this.axes.x = d3.axisBottom(this.scales.x)

      this.axes.y = g => g
        .call(d3.axisLeft(this.scales.y))
        .call(g => g.select('.tick:last-of-type text').clone()
          .attr('x', 6)
          .attr('text-anchor', 'start')
          // .attr('font-weight', 'bold')
          .text(this.selectedDepVar))

      this.means.append('g')
        .attr('class', 'axis axis--xMeans')
        .attr('transform', `translate(0, ${this.height})`)
        .call(this.axes.x)

      this.means.append('g')
        .attr('class', 'axis axis--yMeans')
        .call(this.axes.y)
    },
    updateMeansChart () {
      this.chunkMeans.push(this.filterMean)

      this.scales.x.domain(d3.extent(this.chunkMeans, d => d.minYear))
      this.scales.y.domain(d3.extent(this.chunkMeans, d => d.valueMean))

      let circles = this.means.selectAll('circle')
        .data(this.chunkMeans)

      circles.enter()
        .append('circle')
        .attr('cx', d => this.scales.x(d.minYear))
        .attr('cy', d => this.scales.y(d.valueMean))
        .attr('r', 3)
        .attr('stroke', this.colorChunkDots)
        .attr('fill', this.colorChunkDots)
        .on('mouseenter', this.enteredChunkDot)
        .on('mouseleave', this.leftChunkDot)

      circles.exit().remove()
      // ////////////////////////////////////
      const getYear = d3.timeFormat('%Y')
      let lrChunkMeans = regressionLinear()
        .x(d => getYear(d.minYear))
        .y(d => d.valueMean)

      let lrChunkMeansForChart = regressionLinear()
        .x(d => d.minYear)
        .y(d => d.valueMean)

      let lr = lrChunkMeans(this.chunkMeans)
      let lrForChart = lrChunkMeansForChart(this.chunkMeans)

      this.means.selectAll('line').remove()

      this.means.append('line')
        .datum(lrForChart)
        .attr('x1', d => this.scales.x((d[0][0])))
        .attr('x2', d => this.scales.x(d[1][0]))
        .attr('y1', d => this.scales.y(d[0][1]))
        .attr('y2', d => this.scales.y(d[1][1]))
        .attr('stroke', '#4f5459')
      // //////////////////////////////////////
      this.means.selectAll('.rSq').remove()
      this.means.selectAll('.slope').remove()

      this.means.append('text')
        .attr('class', 'rSq')
        .attr('x', this.width - 140)
        .attr('y', this.height - 20)
        .text('r-squared = ' + d3.format('.2r')(lr.rSquared))
        //.text('r-squared = ' + lr.rSquared.toFixed(3))
        .attr('font-family', 'sans-serif')

      this.means.append('text')
        .attr('class', 'slope')
        .attr('x', this.width - 112)
        .attr('y', this.height - 40)
        .text('Slope = ' + d3.format('.2r')(lr.a))
        //.text('Slope = ' + lr.a.toFixed(3))
        .attr('font-family', 'sans-serif')

      this.means.exit().remove()

      this.means.select('.axis--xMeans').call(this.axes.x)
      this.means.select('.axis--yMeans').selectAll('.tick:last-of-type text').text('')
      this.means.select('.axis--yMeans').call(this.axes.y)
    },
    dateParseY () {
      return d3.timeFormat('%j')
    },
    colorChunkDots (d, i, n) {
      if (i === this.numChunks) { // the filtered rect is the last elelment
        return 'red'
      } else if (d.beforeNotAfter) {
        let r = d3.range(0, this.chunkCounters[0]) // reverse the order because before chunks are counted from right to left
        return d3.interpolateViridis(r[this.chunkCounters[0] - i - 1] / this.numChunks)
      } else {
        return d3.interpolateViridis(i / this.numChunks)
      }
    },
    enteredChunkDot (d, i, n) {
      n[i].parentNode.appendChild(n[i]) // move to front

      d3.select(n[i])
        .attr('r', 6)

      let rectFiltered = this.getRectFromDot(n[i]) // this doesn't work for the filtered mean because the filtered rect is not part of .chunkRects
      d3.select(rectFiltered)
        .attr('height', 5)
    },
    leftChunkDot (d, i, n) {
      d3.select(n[i])
        .attr('r', 3)

      let rectFiltered = this.getRectFromDot(n[i])
      d3.select(rectFiltered)
        .attr('height', 2.5)
    },
    getRectFromDot (dot) {
      let rects = d3.select('.chunkRects').selectAll('rect').nodes()
      let pathStroke = d3.select(dot).attr('fill')
      let rectsF = rects.filter(function (d) { return d3.select(d).attr('fill') === pathStroke })
      return rectsF[0]
    }
  }
}
</script>
