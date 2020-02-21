<template>
  <div class='rect-chart'>
    <svg></svg>
  </div>
</template>

<script>
import * as d3 from 'd3'

export default {
  name: 'RectChart',
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
    chunkDaysForRect: {
      type: Array,
      required: false,
      defaults: () => []
    },
    chunkCounters: {
      type: Array,
      required: false,
      defaults: () => []
    }
  },
  data: () => ({
    svg: null,
    widthMax: 960,
    heightMax: 40,
    margin: {
      top: 0,
      right: 50,
      bottom: 0,
      left: 40
    }
  }),
  created () {
  },
  mounted () {
    this.initializeRectChart()
  },
  watch: {
    'filledData' () {
      this.initializeRectChart()
    },
    'extent' () {
      this.updateFilterRect()
      this.updateChunkRects()
    }
  },
  methods: {
    initializeRectChart () {
      d3.select('.rect-chart').selectAll('svg > *').remove()
      this.svg = d3.select('.rect-chart').select('svg')
      this.svg
        .attr('width', this.widthMax)
        .attr('height', this.heightMax)

      this.svg.append('g')
        .attr('class', 'chunkRects')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')

      this.svg.append('g')
        .attr('class', 'filterRect')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
    },
    updateFilterRect () {
      let rects = d3.select('.filterRect').selectAll('rect')
        .data(this.filterDaysForRect)

      rects.enter()
        .append('rect')

      rects
        .attr('fill', 'red')
        .attr('y', this.heightMax / 2)
        .attr('x', function (d) { return d.start })
        .attr('height', 2)
        .attr('width', function (d) { return d.width })
        .on('mouseenter', this.enteredFilterRect)
        .on('mouseleave', this.leftFilterRect)

      rects.exit().remove()
    },
    enteredFilterRect (d, i, n) {
      n[i].parentNode.appendChild(n[i]) // move rect to front

      d3.select(n[i])
        .attr('height', 5)

      let lineCFD = d3.select('.lineCFD')
        .attr('stroke-width', 5)
        .attr('stroke-opacity', 1)

      lineCFD.node().parentNode.appendChild(lineCFD.node()) // move lineCFD to front
    },
    leftFilterRect (d, i, n) {
      d3.select(n[i])
        .attr('height', 2.5)

      d3.select('.lineCFD')
        .attr('stroke-width', 2.5)
        .attr('stroke-opacity', 0.6)
    },
    updateChunkRects () {
      let rects = d3.select('.chunkRects').selectAll('rect')
        .data(this.chunkDaysForRect)

      rects.enter()
        .append('rect')

      rects.attr('fill', this.colorRectLines)
        .attr('y', this.positionRectLines)
        .attr('x', function (d) { return d.start })
        .attr('height', 2)
        .attr('width', function (d) { return d.width })
        .on('mouseenter', this.enteredRect)
        .on('mouseleave', this.leftRect)

      rects.exit().remove()
    },
    colorRectLines (d, i) {
      if (d.beforeNotAfter) {
        let r = d3.range(0, this.chunkCounters[0]) // reverse the order because before chunks are counted from right to left
        return d3.interpolateViridis(r[this.chunkCounters[0] - i - 1] / this.numChunks)
      } else {
        return d3.interpolateViridis(i / this.numChunks)
      }
    },
    positionRectLines (d, i) {
      if (i % 2 === 0) {
        return this.heightMax / 2 - 1
      } else {
        return this.heightMax / 2 + 1
      }
    },
    enteredRect (d, i, n) {
      n[i].parentNode.appendChild(n[i]) // move to front

      d3.select(n[i])
        .attr('height', 5)

      let pathFiltered = this.getPathFromRect(n[i])
      d3.select(pathFiltered)
        .attr('stroke-width', 5)
        .attr('stroke-opacity', 1)

      let dotFiltered = this.getDotFromRect(n[i])
      d3.select(dotFiltered)
        .attr('r', 6)

      pathFiltered.parentNode.appendChild(pathFiltered) // move to front

      let rW = d3.select('.rectWindow')
      rW.select('rect')
        .attr('display', 'null')
        .attr('x', d.start)
        .attr('y', '0')
        .attr('width', d.width)
        .attr('height', '69')
        .attr('fill', '#d3dae3')
        .attr('fill-opacity', '0.3')
        .attr('shape-rendering', 'crispEdges')
    },
    leftRect (d, i, n) {
      d3.select(n[i])
        .attr('height', 2.5)

      let pathFiltered = this.getPathFromRect(n[i])
      d3.select(pathFiltered)
        .attr('stroke-width', 2.5)
        .attr('stroke-opacity', 0.6)

      let dotFiltered = this.getDotFromRect(n[i])
      d3.select(dotFiltered)
        .attr('r', 3)

      let rW = d3.select('.rectWindow')

      rW.select('rect')
        .attr('display', 'none')
    },
    getPathFromRect (rect) {
      let paths = d3.select('.lineChunks').selectAll('path').nodes()
      let rectFill = d3.select(rect).attr('fill')
      let pathsF = paths.filter(function (d) { return d3.select(d).attr('stroke') === rectFill })
      return pathsF[0]
    },
    getDotFromRect (dot) {
      let dots = d3.select('.chunkmeans').selectAll('circle').nodes()
      let dotFill = d3.select(dot).attr('fill')
      let dotsF = dots.filter(function (d) { return d3.select(d).attr('stroke') === dotFill })
      return dotsF[0]
    }
  }
}
</script>
