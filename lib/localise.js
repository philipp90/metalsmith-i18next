'use strict'

var helpers     = require('./helpers'),
    bootstrap   = require('./bootstrap'),
    multimatch  = require('multimatch'),
    fs          = require('fs'),
    i18nHelpers = fs.readFileSync(__dirname + '/helpers.js').toString('utf8')

i18nHelpers = i18nHelpers.replace(/module.exports\s*=\s*/, '')
i18nHelpers = `;(function(root){ root.i18nHelpers = ${i18nHelpers}})(window)`

function fileMatchesPattern(file, pattern) {
	return !!(multimatch([file], pattern).length)
}


module.exports = function(debug, i18next, options) { 

	var localisedFilePath = helpers(i18next, {path:()=>options.path}).localisedFilePath,
		helpersPath = options.helpers

	return function(files, metalsmith, done) {

		if (!files[helpersPath]) {
			files[helpersPath] = {contents: new Buffer(i18nHelpers, 'utf8')}
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
					    
					// Add the current locale
					f.locale = locale
					f.t      = h.t
					f.tt     = h.tt
					f.tpath  = h.tpath

					// Add client-side configuration
					f.i18nBootstrap = bootstrap({
						i18n: {
							lng: locale,
							resGetPath: options.resGetPath,
							ns: {namespaces:options.namespaces, defaultNs:options.namespaces[0]},
							preload: [locale],
							getAsync: false,
							fallbackLng: false
						},
						locale,
						namespace: f.i18nNamespace,
						prefix:    f.i18nPrefix,
						path:      options.path
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