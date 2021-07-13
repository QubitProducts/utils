/* globals describe it beforeEach afterEach */
const Promise = require('sync-p')
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
    onEnterViewport,
    mapElements,
    forEachElement
  let container, one, two, three

  beforeEach(() => {
    ;({
      restoreAll,
      onEvent,
      replace,
      style,
      insertBefore,
      insertAfter,
      onEnterViewport,
      mapElements,
      forEachElement
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
    return scroller(0)
  })

  afterEach(() => {
    restoreAll()
    document.body.innerHTML = ''
  })

  describe('onEnterViewport', function () {
    it('should fire if the element is in view', function () {
      const stub = sinon.stub()
      onEnterViewport(one, stub)
      expect(stub.calledOnce).to.eql(true)
    })

    describe('when the element has no height', function () {
      it('should fire if the element is at the top of the viewport', function () {
        const stub = sinon.stub()
        container.insertAdjacentHTML('afterbegin', '<div id="test-4"></div>')
        const four = container.querySelector('#test-4')
        onEnterViewport(four, stub)
        expect(stub.calledOnce).to.eql(true)
      })

      it('should fire if the element is at the bottom of the viewport', function () {
        const stub = sinon.stub()
        container.innerHTML = `
          <div id='test-1' style='height:100vh;backgrounnd-color:red;'>test 1</div>
          <div id='test-4'></div>
        `
        const four = container.querySelector('#test-4')
        onEnterViewport(four, stub)
        expect(stub.calledOnce).to.eql(true)
      })
    })

    describe('when the element is below the viewport', function () {
      beforeEach(() => {
        one.style.height = window.innerHeight + 'px'
      })

      it('should not fire', function () {
        const stub = sinon.stub()
        onEnterViewport(two, stub)
        expect(stub.called).to.eql(false)
      })

      it('should fire when the element scrolls into view', function () {
        const stub = sinon.stub()
        onEnterViewport(two, stub)
        return scroller(20).then(() => expect(stub.callCount).to.eql(1))
      })

      it('should fire when the element eventually scrolls into view', function () {
        const stub = sinon.stub()
        onEnterViewport(three, stub)
        return scroller(10)
          .then(() => wait(100))
          .then(() => expect(stub.callCount).to.eql(0))
          .then(() => scroller(20))
          .then(() => expect(stub.callCount).to.eql(1))
      })
    })

    describe('when the element is not in the dom', function () {
      it('should fire after scrolling into view', function () {
        two.style.height = window.innerHeight + 'px'
        container.removeChild(one)
        const stub = sinon.stub()
        onEnterViewport(one, stub)
        expect(stub.called).to.eql(false)
        container.appendChild(one)
        return scroller(20).then(() => expect(stub.callCount).to.eql(1))
      })
    })

    describe('when the element is above the viewport due to scroll position', function () {
      beforeEach(() => {
        three.style.height = window.innerHeight + 'px'
        return scroller(20)
      })

      it('should not fire', function () {
        const stub = sinon.stub()
        onEnterViewport(one, stub)
        expect(stub.called).to.eql(false)
      })

      it('should fire when the element scrolls into view', function () {
        const stub = sinon.stub()
        onEnterViewport(two, stub)
        return scroller(0).then(() => {
          expect(stub.called).to.eql(true)
        })
      })

      describe('with multiple elements', function () {
        it('should fire if it scrolls into view', function () {
          const stub = sinon.stub()
          onEnterViewport([one, two], stub)
          return scroller(0)
            .then(() => wait(100))
            .then(() => expect(stub.calledTwice).to.eql(true))
        })
      })
    })

    describe('when the element is above the viewport due to negative margins', function () {
      let zero
      beforeEach(() => {
        container.innerHTML = `<div id='test-0' style='height:10px;margin-top:-10px'>test 0</div>`
        zero = container.querySelector('#test-0')
      })

      it('should not fire', function () {
        const stub = sinon.stub()
        onEnterViewport(zero, stub)
        expect(stub.called).to.eql(false)
      })

      it('should fire when the element becomes viewable', function () {
        const stub = sinon.stub()
        zero.style.marginTop = '0'
        onEnterViewport(zero, stub)
        expect(stub.called).to.eql(true)
      })
    })
  })

  describe('style', function () {
    it('should merge the style', function () {
      style(one, { height: '20px' })
      expect(one.style.height).to.eql('20px')
      expect(one.style.backgroundColor).to.eql('red')
    })

    it('should handle urls', function () {
      const url = 'url(https://example.qubit/1.png)'
      one.style.backgroundImage = url
      style(one, { display: 'none' })
      expect(one.style.display).to.eql('none')
      expect(one.style.backgroundImage.replace(/"/g, '')).to.eql(url)
    })

    it('should merge the style with string syntax', function () {
      style(one, `height: 20px`)
      expect(one.style.height).to.eql('20px')
      expect(one.style.backgroundColor).to.eql('red')
    })

    it('kebabs', function () {
      style(one, { backgroundColor: 'green' })
      expect(one.style.backgroundColor).to.eql('green')
    })

    it('should restore the style', function () {
      style(one, { height: '20px' })()
      expect(one.style.height).to.eql('10px')
      expect(one.style.backgroundColor).to.eql('red')
    })

    it('should handle elements with no style attributes', function () {
      const div = document.createElement('div')
      const restore = style(div, { height: '20px' })
      expect(div.style.height).to.eql('20px')
      restore()
      expect(div.style.height).to.eql('')
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

  describe('mapElements', () => {
    it('maps a node list', () => {
      const node = document.createElement('div')
      node.innerHTML = `
        <div data-product-id="product_1"/>
        <div data-product-id="product_2"/>
      `

      const nodelist = node.querySelectorAll('div')
      const productIds = mapElements(nodelist, e => e.dataset.productId)
      expect(productIds).to.eql(['product_1', 'product_2'])
    })

    it('maps an array', () => {
      const arr = [1, 2]
      const productIds = mapElements(arr, e => e)
      expect(productIds).to.eql([1, 2])
    })

    it('throws when mapping non-iterable', () => {
      const nonIterable = {}
      expect(() => mapElements(nonIterable, e => e)).to.throw(
        'Could not iterate on {}'
      )
    })

    it('throws when mapping string', () => {
      expect(() => mapElements('a string', e => e)).to.throw(
        'Could not iterate on "a string"'
      )
    })
  })

  describe('forEachElement', () => {
    it('executes for a list of elements', () => {
      const node = document.createElement('div')
      node.innerHTML = `
        <div data-product-id="product_1"/>
        <div data-product-id="product_2"/>
      `

      const productIds = []
      const nodelist = node.querySelectorAll('div')

      forEachElement(nodelist, e => productIds.push(e.dataset.productId))
      expect(productIds).to.eql(['product_1', 'product_2'])
    })

    it('executes for an array', () => {
      const arr = [1, 2]
      const productIds = []
      forEachElement(arr, e => productIds.push(e))
      expect(productIds).to.eql([1, 2])
    })

    it('throws when executing on non-iterable', () => {
      const nonIterable = {}
      expect(() => forEachElement(nonIterable, e => e)).to.throw(
        'Could not iterate on {}'
      )
    })

    it('throws when executing on string', () => {
      expect(() => forEachElement('a string', e => e)).to.throw(
        'Could not iterate on "a string"'
      )
    })
  })
})

function fromArray (arr) {
  return _.map(arr, i => i)
}

function scroller (y) {
  return new Promise(resolve => {
    if (window.pageYOffset === y) return resolve()
    window.addEventListener('scroll', function handleScroll () {
      window.removeEventListener('scroll', handleScroll)
      resolve()
    })
    window.scroll(0, y)
  }).then(() => wait(50))
}

function wait (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
