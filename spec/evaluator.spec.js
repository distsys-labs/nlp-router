require('./setup')

const evaluator = require('../src/evaluator')

describe('Evaluator', function () {
  let rules = []
  before(function () {
    rules.push({ fn:
      evaluator.compile({
        name: 'command',
        type: 'imperative',
        ordered: true,
        tokens: [
          {
            name: 'action',
            pos: ['VB', 'VBP']
          },
          {
            name: 'target',
            pos: ['NN', 'NRP', 'NNS', 'NRPS']
          }
        ]
      })
    })

    rules.push({ fn:
      evaluator.compile({
        name: 'whatever',
        tokens: [
          {
            name: 'action',
            pos: ['VB', 'VBP']
          },
          {
            name: 'target',
            pos: ['NN', 'NRP', 'NNS', 'NRPS']
          }
        ]
      })
    })

    rules.push({ fn:
      evaluator.compile({
        name: 'catch-all',
        tokens: []
      })
    })
  })

  it('should match ordered rule', function () {
    return evaluator.match(rules, 'run the jewels fast')
      .should.eql({
        name: 'command',
        data: {
          confidence: 1,
          degree: 0.0825,
          dirtiness: 0,
          ordered: true,
          politeness: 0,
          sentiment: 'neutral',
          tense: 'present',
          tokens: [
            {
              abbreviation: false,
              acronym: false,
              alt: 'run',
              entity: undefined,
              plural: false,
              pos: 'VB',
              verb: false,
              value: 'run'
            },
            {
              abbreviation: false,
              acronym: false,
              alt: 'the',
              entity: undefined,
              plural: false,
              pos: 'DT',
              verb: false,
              value: 'the'
            },
            {
              abbreviation: false,
              acronym: false,
              alt: 'jewels',
              entity: undefined,
              plural: false,
              pos: 'NNS',
              verb: false,
              value: 'jewels'
            },
            {
              abbreviation: false,
              acronym: false,
              alt: 'fast',
              entity: undefined,
              plural: false,
              pos: 'RB',
              verb: false,
              value: 'fast'
            }
          ],
          type: 'imperative',
          values: {
            action: 'run',
            target: 'jewels'
          }
        }
      })
  })

  it('should match unordered rule', function () {
    return evaluator.match(rules, 'the jewels run fast')
      .should.eql({
        name: 'whatever',
        data: {
          confidence: 0.75,
          degree: 0.0825,
          dirtiness: 0,
          ordered: true,
          politeness: 0,
          sentiment: 'neutral',
          tense: 'present',
          tokens: [
            {
              abbreviation: false,
              acronym: false,
              alt: 'the',
              entity: undefined,
              plural: false,
              pos: 'DT',
              value: 'the',
              verb: false
            },
            {
              abbreviation: false,
              acronym: false,
              alt: 'jewels',
              entity: undefined,
              plural: false,
              pos: 'NNS',
              value: 'jewels',
              verb: false
            },
            {
              abbreviation: false,
              acronym: false,
              alt: 'run',
              entity: undefined,
              plural: false,
              pos: 'VBP',
              value: 'run',
              verb: false
            },
            {
              abbreviation: false,
              acronym: false,
              alt: 'fast',
              entity: undefined,
              plural: false,
              pos: 'RB',
              value: 'fast',
              verb: false
            }
          ],
          type: undefined,
          values: {
            action: 'run',
            target: 'jewels'
          }
        }
      })
  })

  it('should fall back to catch-all', function () {
    return evaluator.match(rules, 'what what what')
      .should.eql({
        name: 'catch-all',
        data: {
          confidence: 1,
          degree: 0,
          dirtiness: 0,
          ordered: true,
          politeness: 0,
          sentiment: 'neutral',
          tense: 'present',
          tokens: [
            {
              abbreviation: false,
              acronym: false,
              alt: 'what',
              entity: undefined,
              plural: false,
              pos: 'WP',
              value: 'what',
              verb: false
            },
            {
              abbreviation: false,
              acronym: false,
              alt: 'what',
              entity: undefined,
              plural: false,
              pos: 'WP',
              value: 'what',
              verb: false
            },
            {
              abbreviation: false,
              acronym: false,
              alt: 'what',
              entity: undefined,
              plural: false,
              pos: 'WP',
              value: 'what',
              verb: false
            }
          ],
          type: 'interrogative',
          values: {}
        }
      })
  })
})
