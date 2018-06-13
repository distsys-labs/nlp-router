require('./setup')

const parser = require('../src/parser')

describe('Parser', function () {
  describe('when extracting tokens from pattern', function () {
    it('should extract pattern correctly', function () {
      parser.extract(`{action,VBP} the {target,[NN NNP NNPS NNS]} and go {direction,IN=[up,down, left, right]} {location=/[a-z]+town/} {rest=/.+/+}`)
        .should.eql(
          [
            {
              name: 'action',
              pos: ['VBP']
            },
            {
              name: 'placeholder_1',
              match: ['the']
            },
            {
              name: 'target',
              pos: ['NN', 'NNP', 'NNPS', 'NNS']
            },
            {
              name: 'placeholder_2',
              match: ['and']
            },
            {
              name: 'placeholder_3',
              match: ['go']
            },
            {
              name: 'direction',
              pos: ['IN'],
              match: ['up', 'down', 'left', 'right']
            },
            {
              name: 'location',
              pattern: /[a-z]+town/
            },
            {
              name: 'rest',
              pattern: /.+/,
              multiple: true
            }
          ]
        )
    })
  })

  describe('when standardizing definitions', function () {
    it('should turn single values into arrays', function () {
      parser.standardize({
        tokens: [
          {
            name: 'one',
            pos: 'NN'
          }
        ]
      }).should.eql({
        tokens: [
          {
            name: 'one',
            pos: ['NN']
          }
        ]
      })

      parser.standardize({
        tokens: [
          {
            name: 'one',
            pos: 'NN'
          },
          {
            name: 'two',
            pos: ['NN', 'NNP'],
            match: 'yay'
          }
        ]
      }).should.eql({
        tokens: [
          {
            name: 'one',
            pos: ['NN']
          },
          {
            name: 'two',
            pos: ['NN', 'NNP'],
            match: ['yay']
          }
        ]
      })
    })

    it('should flag as ordered only when appropriate and not specified', function () {
      parser.standardize({
        pattern: 'test',
      }).should.eql({
        pattern: 'test',
        ordered: true
      })

      parser.standardize({
        pattern: '',
      }).should.eql({
        pattern: ''
      })

      parser.standardize({
        pattern: 'test',
        ordered: false
      }).should.eql({
        pattern: 'test',
        ordered: false
      })
    })
  })

  describe('when ranking rule', function () {
    it('should rank rules correctly', function () {
      parser.rank({
        ordered: true,
        type: 'declarative',
        sentiment: 'positive',
        degree: .5,
        confidence: .5,
        tense: 'present'
      }).should.equal(45)
    })

    parser.rank({
      ordered: true,
      tokens: [
        {
          pos: [ 'NN' ]
        },
        {
          match: [ 'is' ]
        },
        {
          pos: [ 'ADJ' ]
        }
      ]
    }).should.equal(11.5)
  })

  describe('when validating rules', function () {
    it('should return true for valid rules', function () {
      const valid = {
        ordered: true,
        type: 'declarative',
        sentiment: 'positive',
        degree: .1,
        confidence: 1,
        tense: 'present',
        tokens: [
          {
            name: 'one',
            pos: [ 'CC' ],
            negated: false
          },
          {
            name: 'two',
            match: [ '1', 'two' ]
          },
          {
            name: 'three',
            pattern: /[a-z]+/
          }
        ]
      }
      parser.validate(valid).should.eventually.eql(valid)
    })

    it('should reject with single broken rule', function () {
      return parser.validate({
        ordered: 'blorp',
        type: 'declarative',
        sentiment: 'positive',
        degree: .1,
        confidence: 1,
        tense: 'present',
        tokens: [
          {
            name: 'one',
            pos: [ 'CC' ],
            negated: false
          },
          {
            name: 'two',
            match: [ '1', 'two' ]
          },
          {
            name: 'three',
            pattern: /[a-z]+/
          }
        ]
      }).should.be.rejectedWith(
        'child "ordered" fails because ["ordered" must be a boolean]'
      )
    })

    it('should reject with multiple broken rules', function () {
      return parser.validate({
        ordered: 'blorp',
        type: 'declompitude',
        sentiment: 'positude',
        degree: 1.4,
        confidence: .001,
        tense: 'pretense',
        tokens: [
          {
            pos: 'CC',
            negated: 1
          },
          {
            name: false,
            match: 0
          }
        ]
      }).should.be.rejectedWith(
        'child "ordered" fails because ["ordered" must be a boolean]. child "type" fails because ["type" must be one of [declarative, imperative, interrogative]]. child "sentiment" fails because ["sentiment" must be one of [positive, neutral, mixed, negative]]. child "tense" fails because ["tense" must be one of [present, past]]. child "degree" fails because ["degree" must be less than or equal to 1]. child "confidence" fails because ["confidence" must be larger than or equal to 0.01]. child "tokens" fails because ["tokens" at position 0 fails because [child "name" fails because ["name" is required], child "pos" fails because ["pos" must be an array], child "negated" fails because ["negated" must be a boolean]], "tokens" at position 1 fails because [child "name" fails because ["name" must be a string], child "match" fails because ["match" must be an array]]]'
      )
    })
  })

  describe('when performing full analysis', function () {
    it('should resolve rule when valid', function () {
      return parser.analyze({
        pattern: '{action,VBP} {target,[NN NNP NNS NNPS]}',
        type: 'imperative'
      }, 'one').should.eventually.eql({
        name: 'one',
        pattern: '{action,VBP} {target,[NN NNP NNS NNPS]}',
        type: 'imperative',
        ordered: true,
        rank: 21,
        tokens: [
          {
            name: 'action',
            pos: ['VBP']
          },
          {
            name: 'target',
            pos: ['NN', 'NNP', 'NNS', 'NNPS']
          }
        ]
      })
    })

    it('should reject with detailed error when invalid', function () {
      return parser.analyze({
        pattern: '{action,VBP} {target,[NN NNP NNS NNPS]}',
        type: 'interclarative'
      }, 'one').should.be.rejectedWith(
        'child "type" fails because ["type" must be one of [declarative, imperative, interrogative]]'
      )
    })
  })
})
