import '../../stylus/components/_tables.styl'
import '../../stylus/components/_data-table.styl'

import VDataIterator from '../VDataIterator'
import VTableHeaders from './VTableHeaders'
import VTableActions from './VTableActions'
import VRowGroup from './VRowGroup'
import VTableProgress from './VTableProgress'
import VRow from './VRow'
import VCell from './VCell'

import { groupByProperty } from '../../util/helpers'

export default {
  name: 'v-data-table',

  extends: VDataIterator,

  inheritAttrs: false,

  provide () {
    const dataTable = {}

    Object.defineProperty(dataTable, 'headers', {
      get: () => this.headers,
      enumerable: true
    })

    Object.defineProperty(dataTable, 'loading', {
      get: () => this.loading,
      enumerable: true
    })

    Object.defineProperty(dataTable, 'isFlexWidth', {
      get: () => this.isFlexWidth
    })

    Object.defineProperty(dataTable, 'widths', {
      get: () => this.widths
    })

    return { dataTable }
  },

  props: {
    dumb: Boolean,
    headers: {
      type: Array,
      default: () => ([])
    },
    showSelectAll: Boolean,
    hideActions: Boolean,
    hideHeader: Boolean,
    groupBy: String,
    fixedHeight: String,
    loading: Boolean
  },

  data () {
    return {
      groupByIndices: []
    }
  },

  computed: {
    isFlexWidth () {
      return this.headers.some(h => h.width && !isNaN(h.width))
    },
    widths () {
      return this.headers.map(h => h.width || (this.isFlexWidth ? 1 : null))
    }
  },

  methods: {
    searchItems (items) {
      const columns = this.headers.filter(h => h.filter)

      if (columns.length) {
        items = items.filter(i => columns.every(column => column.filter(i[column.value])))
        this.searchItemsLength = items.length
      }

      items = VDataIterator.methods.searchItems.call(this, items)

      return items
    },
    sortItems (items, sortBy, sortDesc) {
      sortBy = this.groupBy ? [this.groupBy, ...sortBy] : sortBy
      sortDesc = this.groupBy ? [false, ...sortDesc] : sortDesc

      return VDataIterator.methods.sortItems.call(this, items, sortBy, sortDesc)
    },
    genHeaders (h) {
      const headers = this.computeSlots('header')

      if (!this.hideHeader && !this.dumb) {
        headers.push(h(VTableHeaders, {
          props: {
            showSelectAll: this.showSelectAll
          }
        }))
        headers.push(h(VTableProgress))
      }

      return headers
    },
    genItems (h) {
      const items = []

      if (this.$scopedSlots.item) {
        if (this.groupBy) {
          items.push(this.genBodyWrapper(h, this.genGroupedRows(h, this.computedItems, this.groupBy)))
        } else {
          items.push(this.genBodyWrapper(h, this.genRows(this.computedItems)))
        }
      }

      return items
    },
    genRows (items) {
      return items.map(item => this.$scopedSlots.item(this.createItemProps(item)))
    },
    genGroupedRows (h, items, groupBy) {
      const grouped = groupByProperty(items, groupBy)
      const groups = Object.keys(grouped)

      const rows = []
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i]

        rows.push(
          this.$scopedSlots.group
            ? this.$scopedSlots.group({ groupBy, group, items: grouped[group] })
            : h(VRowGroup, {
              key: `${group}_${i}`
            }, [
              h('span', { slot: 'cell' }, [group]),
              h('template', { slot: 'expansion' }, this.genRows(grouped[group]))
            ])
        )
      }

      return rows
    },
    genFooters (h) {
      const footers = this.computeSlots('footer')

      if (!this.hideActions && !this.dumb) {
        footers.push(h(VTableActions, {
          props: {
            itemsLength: this.itemsLength,
            pageStart: this.pageStart,
            pageStop: this.pageStop,
            page: this.options.page,
            rowsPerPage: this.options.rowsPerPage,
            rowsPerPageItems: this.rowsPerPageItems
          },
          on: {
            'update:page': v => this.options.page = v,
            'update:rowsPerPage': v => this.options.rowsPerPage = v
          }
        }))
      }

      return [this.genBodyWrapper(h, footers)]
    },
    genBodies (h) {
      if (this.dumb) return this.$slots.default

      return VDataIterator.methods.genBodies.call(this, h)
    },
    genBodyWrapper (h, items) {
      return h('div', {
        staticClass: 'v-table__body',
        class: {
          'v-table__body--fixed': this.fixedHeight
        },
        style: {
          height: this.fixedHeight
        }
      }, items)
    },
    genEmpty (h, content) {
      return h(VRow, [h(VCell, content)])
    }
  },

  render (h) {
    return h('div', {
      staticClass: 'v-table v-data-table'
    }, [
      ...this.genHeaders(h),
      ...this.genBodies(h),
      ...this.genFooters(h)
    ])
  }
}
