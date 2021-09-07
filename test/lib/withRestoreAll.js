/* globals describe it */
const withRestoreAll = require('../../lib/withRestoreAll')
const sinon = require('sinon')
const { expect } = require('chai')

describe('once', function () {
  it('should call all the cleanup functions', function () {
    const [stub1, cleanup1] = createFakeUtil()
    const [stub2, cleanup2] = createFakeUtil()
    const stub3 = sinon.stub()
    const utils = { stub1, stub2, stub3 }
    const {
      stub1: newStub1,
      stub2: newStub2,
      stub3: newStub3,
      restoreAll
    } = withRestoreAll(utils)

    expect(stub1.calledOnce).to.eql(false)
    expect(stub2.calledOnce).to.eql(false)
    expect(stub3.calledOnce).to.eql(false)

    newStub1()
    newStub2()
    newStub3()

    expect(stub1.calledOnce).to.eql(true)
    expect(stub2.calledOnce).to.eql(true)
    expect(stub3.calledOnce).to.eql(true)

    expect(cleanup1.calledOnce).to.eql(false)
    expect(cleanup2.calledOnce).to.eql(false)

    restoreAll()

    expect(cleanup1.calledOnce).to.eql(true)
    expect(cleanup2.calledOnce).to.eql(true)

    function createFakeUtil () {
      const stub = sinon.stub()
      const cleanup = sinon.stub()
      stub.returns(cleanup)
      return [stub, cleanup]
    }
  })
})
