const _ = require('slapdash')
const once = require('../lib/once')
const withRestoreAll = require('../lib/withRestoreAll')
const checkIfIterable = require('../lib/checkIfIterable')
const promised = require('../lib/promised')
const noop = () => {}

function onEvent (el, type, fn) {
  el.addEventListener(type, fn)
  return once(() => el.removeEventListener(type, fn))
}

function style (el, css, fn) {
  const originalStyle = el.getAttribute('style')
  const newStyle = typeof css === 'string' ? fromStyle(css) : css
  const merged = {
    ...fromStyle(originalStyle),
    ...newStyle
  }
  el.setAttribute('style', toStyle(merged))
  return once(() => el.setAttribute('style', originalStyle))
}

function fromStyle (style) {
  if (!style) style = ''
  return style.split(';').reduce((memo, val) => {
    if (!val) return memo
    const [key, ...value] = val.split(':')
    memo[key] = value.join(':')
    return memo
  }, {})
}

function toStyle (css) {
  return _.keys(css).reduce((memo, key) => {
    return memo + `${kebab(key)}:${css[key]};`
  }, '')
}

function kebab (str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

function isInViewPort (el) {
  if (el && el.parentElement) {
    const { top, bottom } = el.getBoundingClientRect()
    const isAboveWindowsBottom =
      top === bottom
        ? // If both bottom and top are at window.innerHeight
          // the element is entirely inside the viewport
          top <= window.innerHeight
        : // If the element has height, when top is at window.innerHeight
          // the element is below the window
          top < window.innerHeight
    const isBelowWindowsTop =
      top === bottom
        ? // If both bottom and top are at 0px
          // the element is entirely inside the viewport
          bottom >= 0
        : // If the element has height, when bottom is at 0px
          // the element is above the window
          bottom > 0
    return isAboveWindowsBottom && isBelowWindowsTop
  }
}

function onAnyEnterViewport (els, fn) {
  const disposables = []
  _.each(els, el => disposables.push(onEnterViewport(el, fn)))
  return once(() => {
    while (disposables.length) disposables.pop()()
  })
}

function onEnterViewport (el, fn) {
  if (_.isArray(el)) {
    return onAnyEnterViewport(el, fn)
  }

  if (isInViewPort(el)) {
    fn()
    return noop
  }

  const handleScroll = _.debounce(() => {
    if (isInViewPort(el)) {
      window.removeEventListener('scroll', handleScroll)
      fn()
    }
  }, 50)
  window.addEventListener('scroll', handleScroll)
  return once(() => window.removeEventListener('scroll', handleScroll))
}

function replace (target, el) {
  const parent = target.parentElement
  parent.insertBefore(el, target.nextSibling)
  parent.removeChild(target)
  return once(() => replace(el, target))
}

function insertAfter (target, el) {
  const parent = target.parentElement
  parent.insertBefore(el, target.nextSibling)
  return once(() => parent.removeChild(el))
}

function insertBefore (target, el) {
  const parent = target.parentElement
  parent.insertBefore(el, target)
  return once(() => parent.removeChild(el))
}

function mapElements (elements, cb) {
  checkIfIterable(elements)
  return Array.prototype.map.call(elements, cb)
}

function forEachElement (elements, cb) {
  checkIfIterable(elements)
  Array.prototype.forEach.call(elements, cb)
}

module.exports = () => {
  const utils = withRestoreAll({
    onEvent,
    onEnterViewport,
    replace,
    style,
    insertAfter,
    insertBefore
  })

  _.each(_.keys(utils), key => {
    if (key.indexOf('on') === 0) utils[key] = promised(utils[key])
  })

  return { ...utils, mapElements, forEachElement }
}
