/* globals describe it */
const promised = require('../../lib/promised')
const sinon = require('sinon')
const { expect } = require('chai')

describe('promised', function () {
  it('should not modify any behaviour if a callback is passed', function () {
    const cb = sinon.stub()
    const stub = sinon.spy(function (fn) {
      fn('callbackValue')
      return 'returnValue'
    })
    const promisedStub = promised(stub)
    expect(promisedStub(cb)).to.eql('returnValue')
    expect(cb.calledWith('callbackValue')).to.eql(true)
  })

  it('should return a promise if no callback is passed', function () {
    const stub = sinon.spy(function (fn) {
      fn('callbackValue')
      return 'returnValue'
    })
    const promisedStub = promised(stub)
    return promisedStub().then(callbackValue => {
      expect(callbackValue).to.eql('callbackValue')
    })
  })

  it('should call the dispose function after the promise resolves', function () {
    const dispose = sinon.stub()
    const stub = sinon.spy(function (fn) {
      fn('callbackValue')
      return dispose
    })
    const promisedStub = promised(stub)
    return promisedStub().then(callbackValue => {
      expect(callbackValue).to.eql('callbackValue')
      expect(dispose.calledOnce).to.eql(true)
    })
  })
})
