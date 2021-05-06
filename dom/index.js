const _ = require('slapdash')
const once = require('../lib/once')
const withRestoreAll = require('../lib/withRestoreAll')
const promised = require('../lib/promised')
const noop = () => {}

function onEvent (el, type, fn) {
  el.addEventListener(type, fn)
  return once(() => el.removeEventListener(type, fn))
}

function isInViewPort (el) {
  if (el && el.parentElement) {
    const { top, bottom } = el.getBoundingClientRect()
    return top < window.innerHeight && bottom > 0
  }
  return false
}

function onEnterViewport (el, fn) {
  if (isInViewPort(el)) {
    fn()
    return noop
  }

  const handleScroll = _.debounce(() => {
    if (isInViewPort(el)) {
      document.removeEventListener('scroll', handleScroll)
      fn()
    }
  }, 50)
  document.addEventListener('scroll', handleScroll)
  return once(() => document.removeEventListener('scroll', handleScroll))
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
    insertAfter,
    insertBefore
  })

  _.each(_.keys(utils), key => {
    if (key.indexOf('on') === 0) utils[key] = promised(utils[key])
  })

  return utils
}
