const Promise = require('sync-p')

module.exports = function promised (fn) {
  return (...args) => {
    if (typeof args[args.length - 1] === 'function') {
      return fn(...args)
    }
    let dispose
    return new Promise(resolve => {
      args.push(resolve)
      dispose = fn(...args)
    }).then(value => {
      if (typeof dispose === 'function') {
        dispose()
      }
      return value
    })
  }
}
