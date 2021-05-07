/* globals describe it beforeEach afterEach */
const _ = require('slapdash')
const dom = require('../dom')
const sinon = require('sinon')
const { expect } = require('chai')

describe('dom', function () {
  let restoreAll,
    onEvent,
    replace,
    insertBefore,
    insertAfter,
    style,
    onEnterViewport
  let container, one, two, three

  beforeEach(() => {
    ;({
      restoreAll,
      onEvent,
      replace,
      style,
      insertBefore,
      insertAfter,
      onEnterViewport
    } = dom())
    document.documentElement.style.padding = 0
    document.documentElement.style.margin = 0
    document.body.style.margin = 0
    document.body.style.padding = 0
    container = document.createElement('div')
    document.body.appendChild(container)
    container.innerHTML = `
      <div id='test-1' style='height:10px;background:red;'>test one</div>
      <div id='test-2' style='height:10px;background:green;'>test two</div>
      <div id='test-3' style='height:10px;background:blue;'>test three</div>
    `
    ;[one, two, three] = _.map([1, 2, 3], i =>
      document.querySelector(`#test-${i}`)
    )
  })

  afterEach(() => {
    restoreAll()
    document.body.innerHTML = ''
  })

  describe('onEnterViewport', function () {
    describe('when the element is below the viewport', function () {
      it('should fire immediately if in view', function () {
        const stub = sinon.stub()
        onEnterViewport(one, stub)
        expect(stub.called).to.eql(true)
      })

      it('should not fire', function () {
        one.style.height = window.innerHeight + 'px'
        const stub = sinon.stub()
        onEnterViewport(two, stub)
        expect(stub.called).to.eql(false)
      })

      it('should fire if it scrolls into view', function (cb) {
        one.style.height = window.innerHeight + 'px'
        window.scroll(0, 10)
        onEnterViewport(two, cb)
      })
    })

    describe('when the element is above the viewport', function () {
      it('should not fire', function () {
        two.style.height = window.innerHeight + 'px'
        window.scroll(0, 10)
        const stub = sinon.stub()
        onEnterViewport(one, stub)
        expect(stub.called).to.eql(false)
      })

      it('should fire if it scrolls into view', function (cb) {
        two.style.height = window.innerHeight + 'px'
        window.scroll(0, 10)
        onEnterViewport(two, cb)
        window.scroll(0, 0)
      })
    })
  })

  describe('style', function () {
    it('should merge the style', function () {
      style(one, { height: '20px' })
      expect(one.style.height).to.eql('20px')
      expect(one.style.backgroundColor).to.eql('red')
    })

    it('should restore the style', function () {
      style(one, { height: '20px' })()
      expect(one.style.height).to.eql('10px')
      expect(one.style.backgroundColor).to.eql('red')
    })
  })

  describe('onEvent', function () {
    it('should add a listener and return a restore function', function () {
      const stub = sinon.stub()
      const restore = onEvent(one, 'click', stub)
      one.click()
      expect(stub.calledOnce).to.eql(true)
      restore()
      one.click()
      expect(stub.calledOnce).to.eql(true)
    })

    describe('if no callback is passed', function () {
      it('should return a promise', function () {
        const stub = sinon.stub()
        onEvent(one, 'click').then(stub)
        one.click()
        expect(stub.calledOnce).to.eql(true)
      })

      it('should be restorable with restoreAll', function () {
        const stub = sinon.stub()
        onEvent(one, 'click').then(stub)
        restoreAll()
        one.click()
        expect(stub.called).to.eql(false)
      })
    })
  })

  describe('replace', function () {
    it('should replace an element and return a restore function', function () {
      const dummy = document.createElement('div')
      dummy.id = 'dummy'
      const restore = replace(two, dummy)
      expect(fromArray(container.children)).to.eql([one, dummy, three])
      restore()
      expect(fromArray(container.children)).to.eql([one, two, three])
    })
  })

  describe('insertBefore', function () {
    it('should insertBefore an element and return a restore function', function () {
      const dummy = document.createElement('div')
      dummy.id = 'dummy'
      const restore = insertBefore(two, dummy)
      expect(fromArray(container.children)).to.eql([one, dummy, two, three])
      restore()
      expect(fromArray(container.children)).to.eql([one, two, three])
    })
  })

  describe('insertAfter', function () {
    it('should insertAfter an element and return a restore function', function () {
      const dummy = document.createElement('div')
      dummy.id = 'dummy'
      const restore = insertAfter(two, dummy)
      expect(fromArray(container.children)).to.eql([one, two, dummy, three])
      restore()
      expect(fromArray(container.children)).to.eql([one, two, three])
    })
  })
})

function fromArray (arr) {
  return _.map(arr, i => i)
}
