<template>
  <v-app>
    <v-app-bar app clipped-left dark>
      <v-toolbar-title class="headline">
        <span>SHEDS</span>
        <span class="font-weight-light px-2">|</span>
        <span class="font-weight-light">Tagged Animal Movement Explorer (TAME)</span>
        <!-- <span class="font-weight-light px-2">|</span> -->
        <span class="text-uppercase overline ml-3">Alpha Version</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text small href="https://ecosheds.org">
        <v-icon small left>mdi-home</v-icon> SHEDS
      </v-btn>
    </v-app-bar>

    <v-content>
      <tame-map :center="map.center" :zoom="map.zoom" :basemaps="map.basemaps" @ready="mapIsReady">
        <tame-map-layer
          :data="dataset"
          :getColor="getColor"
          :getOutline="getOutline"
          :getSize="getSize"
          :selected-ids="selected.ids"
          :showLines="map.showLines"
          @click="selectId">
        </tame-map-layer>
      </tame-map>
      <v-container fill-height fluid class="ml-2">
        <v-layout row>
          <v-flex grow-shrink-0>
            <v-card width="550" class="mb-3">
              <v-toolbar dark dense color="primary">
                <h4>
                  <v-icon size="18" left>mdi-database</v-icon>
                  <strong>Dataset</strong>: {{ theme ? theme.label : 'None' }}
                </h4>
                <v-spacer></v-spacer>
                <v-dialog
                  v-model="dialogs.about"
                  scrollable
                  width="800">
                  <template v-slot:activator="{ on }">
                    <v-btn small class="grey darken-1" rounded v-on="on">
                      <v-icon size="20" left>mdi-alert-circle-outline</v-icon> About
                    </v-btn>
                  </template>

                  <v-card>
                    <v-toolbar dense color="grey lighten-2">
                      <strong>About This Dataset</strong>
                      <v-spacer></v-spacer>
                      <v-btn height="24" width="24" icon @click="dialogs.about = false" class="grey darken-1 elevation-2 mr-0" dark>
                        <v-icon small>mdi-close</v-icon>
                      </v-btn>
                    </v-toolbar>

                    <v-card-text class="mt-2">
                      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                    </v-card-text>
                  </v-card>
                </v-dialog>
              </v-toolbar>
            </v-card>
            <v-card width="550" class="mb-3">
              <v-tabs
                v-model="tabs.active"
                background-color="primary"
                dark
                slider-color="white">
                <v-tab ripple>
                  <v-icon small class="mr-1">mdi-map</v-icon> Map Variables
                </v-tab>
                <v-tab ripple>
                  <v-icon small class="mr-1">mdi-crosshairs-gps</v-icon> Selection
                </v-tab>
                <v-tab ripple>
                  <v-icon small class="mr-1">mdi-chart-bar</v-icon> Filters
                </v-tab>
                <v-spacer></v-spacer>
                <v-btn height="24" width="24" icon @click="tabs.collapse = !tabs.collapse" class="grey darken-1 elevation-2 mt-3 mr-4" dark>
                  <v-icon v-if="!tabs.collapse">mdi-menu-up</v-icon>
                  <v-icon v-else>mdi-menu-down</v-icon>
                </v-btn>
                <v-tab-item :transition="false" :reverse-transition="false">
                  <v-card v-show="!tabs.collapse">
                    <v-card-text>
                      <v-autocomplete
                        v-model="color.selected"
                        label="Color By"
                        item-value="id"
                        item-text="description"
                        return-object
                        clearable
                        :items="color.options">
                      </v-autocomplete>
                      <v-autocomplete
                        v-model="size.selected"
                        label="Size By"
                        item-value="id"
                        item-text="description"
                        return-object
                        clearable
                        :items="size.options">
                      </v-autocomplete>
                      <v-autocomplete
                        v-model="outline.selected"
                        label="Outline By"
                        item-value="id"
                        item-text="description"
                        return-object
                        clearable
                        :items="outline.options">
                      </v-autocomplete>
                      <v-switch v-model="map.showLines" label="Show All Connection Lines">
                      </v-switch>
                      <!-- <v-switch v-model="map.showLines">
                        <template v-slot:label>
                          <div>
                            Show All Connection Lines
                            <v-tooltip right max-width="300" open-delay="300">
                              <template v-slot:activator="{ on }">
                                <v-icon right color="grey lighten-1" v-on="on">mdi-alert-circle-outline</v-icon>
                              </template>
                              <div>
                                Show/hide all lines connecting consecutive locations for each individual. <br>
                                Does not apply to individuals that are selected or hovered over.
                              </div>
                            </v-tooltip>
                          </div>
                        </template>
                      </v-switch> -->
                    </v-card-text>
                  </v-card>
                </v-tab-item>
                <v-tab-item :transition="false" :reverse-transition="false">
                  <v-card :max-height="$vuetify.breakpoint.height - 210" style="overflow-y: auto" v-show="!tabs.collapse">
                    <v-card-text>
                      <h3>Selected Individuals</h3>

                      <div class="my-3"># Selected Individuals: <span class="black--text">{{ selected.ids.length }}</span></div>

                      <div class="my-4" >
                        <v-btn @click="unselectAll" rounded :disabled="selected.ids.length === 0">
                          <v-icon small left>mdi-delete</v-icon> Unselect All
                        </v-btn>
                      </div>

                      <div class="subheading my-4">
                        <v-icon small>mdi-alert-circle-outline</v-icon>
                        Click a point on the map to select an individual (unique tag ID), which will highlight all locations that individual was observed.
                        Click on a selected individual to unselect it.
                        More than one individual can be selected at a time.
                      </div>

                      <v-divider class="my-3"></v-divider>

                      <h3>Select By Area</h3>

                      <div class="my-3"># Selection Areas: <span class="black--text">{{ draw.count }}</span></div>

                      <div class="my-4">
                        <v-radio-group v-model="draw.operation" row hide-details label="Operation:" :disabled="draw.enabled">
                          <v-radio value="intersection">
                            <template v-slot:label>
                              <div>Intersection (<v-icon>mdi-set-center</v-icon>)</div>
                            </template>
                          </v-radio>
                          <v-radio value="union">
                            <template v-slot:label>
                              <div>Union (<v-icon>mdi-set-all</v-icon>)</div>
                            </template>
                          </v-radio>
                        </v-radio-group>
                      </div>

                      <div class="my-4">
                        <v-btn @click="toggleDraw" rounded v-if="!draw.enabled">
                          <v-icon small left>mdi-selection-drag</v-icon> Draw New Area
                        </v-btn>
                        <v-btn @click="toggleDraw" rounded v-else>
                          <v-icon small left>mdi-close</v-icon> Cancel
                        </v-btn>
                        <v-btn @click="clearDraw" rounded class="ml-3" :disabled="draw.count === 0">
                          <v-icon small left>mdi-delete</v-icon> Clear All
                        </v-btn>
                      </div>

                      <div class="subheading my-3">
                        <v-icon small>mdi-alert-circle-outline</v-icon>
                        Select all individuals that were observed in a specific area by clicking <strong>Draw New Area</strong>
                        and then click-and-drag to draw the target area on the map.
                        Add more areas to select individuals that passed through multiple areas.
                        <strong>Intersection</strong> selects individuals that passed through ALL areas, <strong>Union</strong> selects individuals that passed through ANY of the areas.
                        These selections are not affected by the crossfilters.
                      </div>
                    </v-card-text>
                  </v-card>
                </v-tab-item>
                <v-tab-item :transition="false" :reverse-transition="false">
                  <v-card :max-height="$vuetify.breakpoint.height - 210" style="overflow-y: auto" v-show="!tabs.collapse">
                    <v-card-text>
                      <v-autocomplete
                        :items="filters.options"
                        v-model="filters.selected"
                        multiple
                        dense
                        return-object
                        item-value="id"
                        item-text="description"
                        chips
                        deletable-chips
                        clearable
                        label="Select filter variable(s)...">
                      </v-autocomplete>
                      <p v-if="filters.selected.length > 0" class="subheading">
                        <v-icon small>mdi-alert-circle-outline</v-icon>
                        Use the dropdown above to add/remove filters.
                        Each filter shows a histogram of the observations.
                        Click and drag on a histogram to filter the dataset.
                        Only observations that meet ALL filter criteria are shown on the map.
                      </p>
                      <tame-filter v-for="variable in filters.selected" :key="variable.id" :variable="variable" @close="removeFilter(variable)"></tame-filter>
                    </v-card-text>
                  </v-card>
                </v-tab-item>
              </v-tabs>
            </v-card>
          </v-flex>
          <v-spacer></v-spacer>
          <v-flex grow-shrink-0 class="mr-8">
            <v-card width="250" :max-height="$vuetify.breakpoint.height - 100 - 120 * debug.visible" style="overflow-y: auto" class="mb-3">
              <v-toolbar dense dark color="primary">
                <strong>Legend</strong>
                <v-spacer></v-spacer>
                <v-btn height="24" width="24" icon @click="legend.collapse = !legend.collapse" class="grey darken-1 elevation-2 mr-0" dark>
                  <v-icon v-if="!legend.collapse">mdi-menu-up</v-icon>
                  <v-icon v-else>mdi-menu-down</v-icon>
                </v-btn>
              </v-toolbar>
              <v-card-text v-show="!legend.collapse">
                <div class="grey--text text--darken-2">
                  <h4>Filtered: {{ crossfilter.counts.filtered.toLocaleString() }} of {{ crossfilter.counts.total.toLocaleString() }} ({{ (crossfilter.counts.filtered / crossfilter.counts.total * 100).toFixed(0) }}%)</h4>
                </div>
                <v-divider class="my-2"></v-divider>
                <tame-legend-color :variable="color.selected"></tame-legend-color>
                <tame-legend-size :variable="size.selected"></tame-legend-size>
                <tame-legend-outline :variable="outline.selected"></tame-legend-outline>
              </v-card-text>
            </v-card>
            <v-card class="mb-3" v-if="debug.visible">
              <v-toolbar dense dark color="red darken-4">
                <strong>Debug</strong>
                <v-spacer></v-spacer>
                <v-btn height="24" width="24" icon @click="debug.collapse = !debug.collapse" class="grey darken-1 elevation-2 mr-0" dark>
                  <v-icon v-if="!debug.collapse">mdi-menu-up</v-icon>
                  <v-icon v-else>mdi-menu-down</v-icon>
                </v-btn>
              </v-toolbar>
              <v-card-text v-if="!debug.collapse" style="font-family:monospace">
                selected.ids: {{ selected.ids.length }}
              </v-card-text>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
  </v-app>
</template>
