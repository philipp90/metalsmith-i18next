'use strict'

var helpers     = require('./helpers'),
    bootstrap   = require('./bootstrap'),
    multimatch  = require('multimatch'),
    fs          = require('fs'),
    i18nHelpers = fs.readFileSync(__dirname + '/helpers.js')


function fileMatchesPattern(file, pattern) {
	return !!(multimatch([file], pattern).length)
}


module.exports = function(debug, i18next, options) { 

	var localisedFilePath = helpers(i18next, {path:()=>options.path}).localisedFilePath,
		helpersPath = options.helpers

	return function(files, metalsmith, done) {

		if (!files[helpersPath]) {
			files[helpersPath] = {contents:i18nHelpers}
		}

		// Loop through all of the files
		Object.keys(files).forEach(function(file){

			// Process only the ones that match our pattern
			if (fileMatchesPattern(file, options.pattern)) {

				debug('Processing %s', file)

				// Loop on each locale
				options.locales.forEach(function(locale){

					// Copy the original file object, determine its new path.
					let f = Object.assign({}, files[file]),
					    p = localisedFilePath(file, locale),
					    h = helpers(i18next, {
					    	locale:    () => locale, 
					    	namespace: () => f.i18nNamespace, 
					    	prefix:    () => f.i18nPrefix, 
					    	path:      () => options.path
					    })

					// Load the translation resources
					var ns    = f.i18nNamespace || options.namespaces[0],
					    res   = fs.readFileSync(options.nsPath.replace('__ns__',ns).replace('__lng__',locale)),
					    store = {}

					store[locale] = {}
					store[locale][ns] = JSON.parse(res)

					    
					// Add the current locale
					f.locale = locale
					f.t      = h.t
					f.tt     = h.tt
					f.tpath  = h.tpath
					f.i18nOrigPath = file
					f.i18nResStore = store

					// Add client-side configuration
					f.i18nBootstrap = bootstrap({
						lng: locale,
						resGetPath: options.resGetPath,
						ns: {namespaces:options.namespaces, defaultNs:ns},
						preload: [locale],
						getAsync: false,
						fallbackLng: false,
						prefix: f.i18nPrefix,
						path: options.path
					})

					// Add the new file to the list of files
					debug('Adding file %s', p)
					files[p] = f
				})	

				// Delete the original file once all locale specific files have been added
				debug('Removing file %s', file)
				delete files[file]
			}
		})

		done()
	}
}