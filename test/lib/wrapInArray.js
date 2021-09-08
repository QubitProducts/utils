/* globals describe it */
const { expect } = require('chai')
const wrapInArray = require('../../lib/wrapInArray')

describe('wrapInArray', function () {
  it('should wrap value in array', function () {
    const wrapped = wrapInArray(5)
    expect(wrapped).to.eql([5])
  })

  it('should wrap once', function () {
    const wrapped = wrapInArray([42])
    expect(wrapped).to.eql([42])
  })
})
