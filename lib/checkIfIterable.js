function throwError (value) {
  throw new Error(`Could not iterate on ${JSON.stringify(value)}`)
}

module.exports = function checkIfIterable (value) {
  if (typeof value === 'string') {
    throwError(value)
  }
  if (!(Symbol.iterator in Object(value))) {
    throwError(value)
  }
}
