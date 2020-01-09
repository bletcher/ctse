import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'

Vue.config.productionTip = false

export const eventBus = new Vue({
  methods: {
    emitChunks (d) {
      this.$emit('updatedChunks', d)
      // console.log('main:emitChunks', d)
    }
  }
})

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')
