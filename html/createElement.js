const wrapInArray = require('../lib/wrapInArray')

module.exports = function createElement ({
  type,
  id,
  classList,
  onClick,
  innerHTML
}) {
  const element = document.createElement(type)

  if (id) element.setAttribute('id', id)
  if (classList) element.classList.add(...wrapInArray(classList))
  if (onClick) element.onclick = onClick
  if (innerHTML) element.innerHTML = innerHTML

  return element
}
