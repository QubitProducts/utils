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
    appendChild,
    style,
    onEnterViewport,
    closest
  let container, one, two, three

  beforeEach(() => {
    ;({
      restoreAll,
      onEvent,
      replace,
      style,
      insertBefore,
      insertAfter,
      appendChild,
      onEnterViewport,
      closest
    } = dom())
    document.documentElement.style.padding = 0
    document.documentElement.style.margin = 0
    document.body.style.margin = 0
    document.body.style.padding = 0
    container = document.createElement('div')
    container.classList.add('container')
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

  describe('appendChild', function () {
    it('should appendChild an element and return a restore function', function () {
      const dummy = document.createElement('div')
      dummy.id = 'dummy'
      const restore = appendChild(two, dummy)
      expect(fromArray(container.children)).to.eql([one, two, three])
      expect(fromArray(two.children)).to.eql([dummy])
      restore()
      expect(fromArray(container.children)).to.eql([one, two, three])
      expect(fromArray(two.children)).to.eql([])
    })
  })

  describe('closest', function () {
    describe('with window.Element.prototype.closest', function () {
      it('should return the closest element to the provided element using the selector if that element exists', function () {
        const target = document.getElementById('test-1')
        const result = closest(target, '.container')
        expect(result.classList.contains('container')).to.eql(true)
      })

      it('should return null if no closest element can be found using the selector', function () {
        const target = document.getElementById('test-1')
        const result = closest(target, '.im-not-here')
        expect(result).to.eql(null)
      })
    })

    describe('without window.Element.prototype.closest', function () {
      const ogClosest = window.Element.prototype.closest
      beforeEach(() => {
        delete window.Element.prototype.closest
      })

      afterEach(() => {
        window.Element.prototype.closest = ogClosest
      })

      it('should return the closest element to the provided element using the selector if that element exists', function () {
        const target = document.getElementById('test-1')
        const result = closest(target, '.container')
        expect(result.classList.contains('container')).to.eql(true)
      })

      it('should return null if no closest element can be found using the selector', function () {
        const target = document.getElementById('test-1')
        const result = closest(target, '.im-not-here')
        expect(result).to.eql(null)
      })

      describe('without window.Element.prototype.matches', function () {
        const ogMatches = window.Element.prototype.matches
        beforeEach(() => {
          delete window.Element.prototype.matches
        })

        afterEach(() => {
          window.Element.prototype.matches = ogMatches
        })

        it('should return the closest element to the provided element using the selector if that element exists', function () {
          const target = document.getElementById('test-1')
          const result = closest(target, '.container')
          expect(result.classList.contains('container')).to.eql(true)
        })

        it('should return null if no closest element can be found using the selector', function () {
          const target = document.getElementById('test-1')
          const result = closest(target, '.im-not-here')
          expect(result).to.eql(null)
        })
      })
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
