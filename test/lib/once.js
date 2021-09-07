/* globals describe it */
const once = require('../../lib/once')
const sinon = require('sinon')
const { expect } = require('chai')

describe('once', function () {
  it('should only allow a function to be called once', function () {
    const stub = sinon.stub()
    const onceFn = once(stub)
    for (let i = 0; i < 100; i++) {
      onceFn(i)
    }
    expect(stub.callCount).to.eql(1)
    expect(stub.calledWith(0)).to.eql(true)
  })
})
