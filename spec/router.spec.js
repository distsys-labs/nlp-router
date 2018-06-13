require('./setup')

const Router = require('../src/index')

describe('Router', function () {
  describe('with simple router', function () {
    let router
    before(function () {
      router = Router()
      return Promise.all([
        router.addRule(
          'greet',
          {
            pattern: 'say hello to {name,[NN NNP NNPS NNS PP]}'
          }, (d) => `hi, ${d.values.name}`),
        router.addRule(
          'unknown',
          {
          },
          () => 'what are you doing?'
        )
      ])
    })

    it('should get correct ranks for rules', function () {
      router.getRank('greet').should.equal(12)
      router.getRank('unknown').should.equal(0)
    })

    it('should pull rule by name', function () {
      router.getRule('unknown')
        .should.partiallyEql({
          name: 'unknown',
          rank: 0
        })
    })

    it('should match eagerly', function () {
      let match = router.evaluate('say hello to my little friend')
      match.should.partiallyEql({
        data: {
          name: 'greet',
          confidence: 1.1666666666666667,
          degree: 0,
          ordered: true,
          sentiment: 'neutral',
          tense: 'present',
          type: 'imperative',
          values: {
            name: 'friend'
          }
        }
      })
      match.value(match.data).should.equal('hi, friend')
    })

    it('should change value correctly', function () {
      router.changeValue('greet', (d) => `oh, hello, ${d.values.name}`)
      let match = router.evaluate('say hello to my little friend')
      match.value(match.data).should.equal('oh, hello, friend')
    })

    it('should hit fallback match', function () {
      router.evaluate('blah blah')
        .should.partiallyEql({
          data: {
            name: 'unknown',
            confidence: 1,
            ordered: true,
            sentiment: 'negative',
            tense: 'present',
            values: {
            }
          }
        })
    })

    it('should remove rule correctly', function () {
      router.deleteRule('greet')
        .should.eql([true, 1])
      router.evaluate('say hello to billiam')
        .should.partiallyEql({
          data: {
            name: 'unknown',
            confidence: 1,
            ordered: true,
            sentiment: 'neutral',
            tense: 'present',
            values: {
            }
          }
        })
    })

    it('should return null when nothing matches', function () {
      router.deleteRule('unknown')
        .should.eql([true, 0])
      expect(router.evaluate('anyone there?')).to.equal(undefined)
    })
  })
})
