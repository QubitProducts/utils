const _ = require('slapdash')
const once = require('../lib/once')
const withRestoreAll = require('../lib/withRestoreAll')
const promised = require('../lib/promised')
const noop = () => {}

function onEvent (el, type, fn) {
  el.addEventListener(type, fn)
  return once(() => el.removeEventListener(type, fn))
}

function style (el, css, fn) {
  const originalStyle = el.getAttribute('style')
  const merged = {
    ...fromStyle(originalStyle),
    ...css
  }
  el.setAttribute('style', toStyle(merged))
  return once(() => el.setAttribute('style', originalStyle))
}

function fromStyle (style) {
  if (!style) style = ''
  return style.split(';').reduce((memo, val) => {
    if (!val) return memo
    const [key, value] = val.split(':')
    memo[key] = value
    return memo
  }, {})
}

function toStyle (css) {
  return _.keys(css).reduce((memo, key) => {
    return memo + `${key}:${css[key]};`
  }, '')
}

function isInViewPort (el) {
  if (el && el.parentElement) {
    const { top, bottom } = el.getBoundingClientRect()
    return top < window.innerHeight && bottom > 0
  }
  return false
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

  return utils
}
