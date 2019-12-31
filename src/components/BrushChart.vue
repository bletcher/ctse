<template>
  <div class='brush-chart'>
    <svg></svg>
  </div>
</template>

<script>
import * as d3 from 'd3'
// import { eventBus } from '../main'

export default {
  name: 'BrushChart',
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
    heightMax: 100,
    margin: {
      top: 10,
      right: 50,
      bottom: 20,
      left: 40
    },
    scales: {
      x: null,
      y: null
    },
    axes: {
      y: null,
      x: null
    },
    svgElements: {
      context: null
    }
  }),
  mounted () {
    // this.initializeBrushChart()
  },
  watch: {
    'filledData' () {
      this.initializeBrushChart()
    },
    'extent' () {
      console.log('in extent watch')
      this.updateBrushChart()
    }
  },
  computed: {
    width () { return this.widthMax - this.margin.left - this.margin.right },
    height () { return this.heightMax - this.margin.top - this.margin.bottom },
    brush () {
      return d3.brushX()
        .extent([[0, 0], [this.width, this.height]])
        .on('brush end', this.brushed)
    }
  },
  methods: {
    initializeBrushChart () {
      console.log('initializeBrushChart:start')

      d3.select('.brush-chart').selectAll('svg > *').remove()
      this.svg = d3.select('.brush-chart').select('svg')
      this.svg
        .attr('width', this.widthMax)
        .attr('height', this.heightMax)

      this.scales.x = d3.scaleTime().range([0, this.width])
      this.scales.y = d3.scaleLinear().range([this.height, 0])

      this.scales.x.domain(d3.extent(this.filledData, d => d.date))
      this.scales.y.domain(d3.extent(this.filledData, d => d.value)).nice()

      this.axes.x = d3.axisBottom(this.scales.x).ticks(this.width / 80).tickSizeOuter(0)

      this.svgElements.context = this.svg.append('g')
        .attr('class', 'context')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')

      this.svgElements.context.append('path')
        .datum(this.filledData)
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1.5)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', this.line(this.scales))

      this.svgElements.context.append('g')
        .attr('class', 'axis axis--x2')
        .attr('transform', 'translate(0,' + this.height + ')')
        .call(this.axes.x)

      this.svgElements.context.append('g')
        .attr('class', 'brush')
        .call(this.brush)
        .call(this.brush.move, this.scales.x.range())
    },
    updateBrushChart () {
      this.svgElements.context.select('.brush')
        .call(this.brush.move, this.extent.map(this.scales.x, this.scales.x.invert))
    },
    line (scales) {
      return d3.line()
        .defined(d => !isNaN(d.value))
        .x(d => scales.x(d.date))
        .y(d => scales.y(d.value))
    },
    brushed () {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return
      if (!d3.event.sourceEvent) return // don't emit new brushExtent if brush updated with datePicker
      let s = d3.event.selection || this.scales.x.range()
      let brushExtent = s.map(this.scales.x.invert, this.scales.x)
      this.$emit('brushed', brushExtent)
    }
  }
}

</script>
