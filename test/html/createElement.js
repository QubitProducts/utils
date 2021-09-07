/* globals describe it */
const createElement = require('../../html/createElement')
const { expect } = require('chai')

describe('HTML element create helpers', () => {
  describe('createElement function creates a HTML element matching config object', () => {
    ;[['div', 'DIV'], ['a', 'A'], ['p', 'P'], ['h1', 'H1']].forEach(
      ([request, expected]) => {
        const title = `creates requested ${request} HTML element`
        it(title, () => {
          const element = createElement({
            type: request
          })
          expect(element.nodeName).equal(expected)
        })
      }
    )

    it('appends an id to the element', () => {
      const ID = 'ajfoij2902cfv'
      const element = createElement({
        type: 'div',
        id: ID
      })

      expect(element.id).equal(ID)
    })

    it('appends a single class to an element', () => {
      const CLASS_EXAMPLE = 'qp-badge'
      const element = createElement({
        type: 'div',
        classList: CLASS_EXAMPLE
      })

      expect(element.classList.contains(CLASS_EXAMPLE)).to.equal(true)
    })

    it('appends an array of classes to an element', () => {
      const CLASS_EXAMPLE = ['qp-badge', 'qp-wrapper']
      const element = createElement({
        type: 'div',
        classList: CLASS_EXAMPLE
      })

      expect(element.classList.contains(CLASS_EXAMPLE[0])).to.equal(true)
      expect(element.classList.contains(CLASS_EXAMPLE[1])).to.equal(true)
    })

    it('appends an onclick handler to the element', () => {
      const onClick = () => 'ALPHA'
      const element = createElement({
        type: 'div',
        onClick
      })

      expect(element.onclick).equal(onClick)
      expect(element.onclick()).equal(onClick())
    })

    it('adds innerHTML to the element', () => {
      const text = 'the cat jumped over the moon'
      const textNode = document.createTextNode(text)
      const div = document.createElement('p')
      div.appendChild(textNode)

      const innerHTML = '<p>the cat jumped over the moon</p>'
      const element = createElement({
        type: 'div',
        innerHTML: div.outerHTML
      })

      expect(element.innerHTML).equal(innerHTML)
      expect(element.children[0].nodeName).equal('P')
    })
  })
})
