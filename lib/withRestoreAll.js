const _ = require('slapdash')

module.exports = function withRestoreAll (utils) {
  const cleanup = []

  function restorable (fn) {
    return (...args) => {
      const dispose = fn(...args)
      if (typeof dispose === 'function') {
        cleanup.push(dispose)
      }
      return dispose
    }
  }
  const result = {}

  for (const key of _.keys(utils)) {
    result[key] = restorable(utils[key])
  }

  result.restoreAll = function restoreAll () {
    while (cleanup.length) cleanup.pop()()
  }

  return result
}
