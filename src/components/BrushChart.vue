<template>
  <div class='brush-chart'>
    <svg></svg>
  </div>
</template>

<script>
import * as d3 from 'd3'

export default {
  name: 'BrushChart',
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
    heightMax: 100,
    margin: {
      top: 20,
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
    }
  },
  computed: {
    width () { return this.widthMax - this.margin.left - this.margin.right },
    height () { return this.heightMax - this.margin.top - this.margin.bottom }

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
        .call(this.axes.x);      

      // this.svgElements.context.append('g')
      //  .attr('class', 'brush')
      //  .call(brush)
      //  .call(brush.move, x.range())

      console.log('initializeBrushChart:end')
    },
    line (scales) {
      return d3.line()
        .defined(d => !isNaN(d.value))
        .x(d => scales.x(d.date))
        .y(d => scales.y(d.value))
    }
  }
} 

</script>
