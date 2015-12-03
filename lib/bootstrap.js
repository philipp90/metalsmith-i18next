'use strict'

module.exports = function(config) {
	return `
if (!i18n)	throw new Error('i18next must be loaded before bootstraping the client.')
if (!i18nHelpers) throw new Error('i18nHelpers must be loaded before bootstraping the client')
i18nHelpers.bootstrap(window, ${JSON.stringify(config)})
`
}
