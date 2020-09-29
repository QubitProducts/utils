module.exports = function once (fn) {
  let called = false
  return (...args) => {
    if (called) return
    called = true
    return fn(...args)
  }
}
