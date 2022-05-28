module.exports = function wrapInArray (value) {
  return !Array.isArray(value) ? [value] : value
}
