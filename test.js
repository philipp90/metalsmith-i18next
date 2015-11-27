'use strict'

var chai       = require('chai'),
	should     = chai.should(),
	Metalsmith = require('metalsmith'),
	i18next    = require('.'),
	copy       = require('metalsmith-copy'),
	templates  = require('metalsmith-in-place')

describe('metalsmith-i18next', function(){


	// ------------------------------------------------------------------------
	// Generic Test Case
	// ------------------------------------------------------------------------

	function metalsmithTest(config, check) {

		var once = false

		return function(done) {
			Metalsmith('./examples')
			.use(i18next(config))
			.use(templates({
				engine: 'haml-coffee',
				pattern:  '**/*.hamlc'
			}))
			.use(copy({
				pattern: '**/*.hamlc',
				extension: '.txt',
				move: true
			}))
			.build(function(err, files){
				if (once) return
				once = true
				if (err) return done(err)
				try {
					check(files)
					done()
				} catch(err) {
					done(err)
				}
			})
		}
	}



	// ------------------------------------------------------------------------
	// Actual Test Cases
	// ------------------------------------------------------------------------

	it('should create two localised directories each with index.txt', metalsmithTest(
		{		
			pattern: '**/*.hamlc',
			locales: ['en','fr'],
			nsPath: './examples/locales/__lng__/__ns__.json',
			namespaces: ['translations']
		},
		function(files) {

			var enFile = files['en/index.txt'],
				frFile = files['fr/index.txt']

			should.exist(enFile)
			should.exist(frFile)

			enFile.contents.toString('utf8').should.equal('Hello')
			frFile.contents.toString('utf8').should.equal('Bonjour')
		}
	))

	it('should create both index-en.txt and index-fr.txt in the same directory', metalsmithTest(
		{
			pattern: '**/*.hamlc',
			locales: ['en','fr'],
			nsPath: './examples/locales/__lng__/__ns__.json',
			namespaces: ['translations'],
			path: ':dir/:name-:locale:ext'
		},
		function(files) {

			var enFile = files['index-en.txt'],
				frFile = files['index-fr.txt']

			should.exist(enFile)
			should.exist(frFile)

			enFile.contents.toString('utf8').should.equal('Hello')
			frFile.contents.toString('utf8').should.equal('Bonjour')
		}
	))

	it('file should have t, tt, tpath and locale', metalsmithTest(
		{
			pattern: '**/*.hamlc',
			locales: ['en','fr'],
			nsPath: './examples/locales/__lng__/__ns__.json',
			namespaces: ['translations'],
			path: ':dir/:name-:locale:ext'
		},
		function(files) {

			var enFile = files['index-en.txt'],
				frFile = files['index-fr.txt']

			should.exist(enFile)
			should.exist(frFile)

			enFile.t.should.exist
			enFile.tt.should.exist
			enFile.tpath.should.exist
			enFile.locale.should.equal('en')

			frFile.t.should.exist
			frFile.tt.should.exist
			frFile.tpath.should.exist
			frFile.locale.should.equal('fr')
		}
	))
})