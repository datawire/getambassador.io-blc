#!/usr/bin/env node

const blc = require('broken-link-checker');
const path = require('path');

function main(baseurl) {

	const baseu = new URL(baseurl);
	const handleLink = function(result) {
		if (result.broken === true) {
			console.log(`Page ${result.base.resolved} has a broken link: "${result.url.original}" (${result.brokenReason})`);
		} else if (result.url.resolved === null) {
			// skip
		} else {
			let u = new URL(result.url.resolved);
			if (u.hostname ===  'blog.getambassador.io') {
				// skip
			} else if (u.hostname.endsWith('getambassador.io') || u.hostname.endsWith(baseu.hostname)) {
				// This is an internal link--validate that it's relative.
				if ((result.url.original === result.url.resolved) || result.url.original.startsWith('/')) {
					let srcpath = (new URL(result.base.resolved)).pathname;
					let dstpath = u.pathname;
					let suggestion = path.relative(srcpath.replace(/\/[^/]*$/, '/'), dstpath);
					console.log(`Page ${result.base.resolved} has a malformed link: "${result.url.original}" (did you mean "${suggestion}"?)`);
				}
			}
		}
	};

	const options = {
		excludeLinksToSamePage: false,
		filterLevel: 3,
		honorRobotExclusions: false,
	};
	const handlers = {
		robots: function(robots) {},
		html: function(tree, robots, response, pageUrl) {},
		junk: handleLink,
		link: handleLink,
		page: function(error, pageURL) {
			if (error != null) {
				console.log("page error:", pageURL, error);
			}
		},
		site: function(error, siteURL) {
			if (error != null) {
				console.log("site error:", siteURL, error);
			}
		},
		end: function() {},
	};

	siteChecker = new blc.SiteChecker(options, handlers);

	siteChecker.enqueue(baseurl);
};

main(process.argv.slice(2)[0] || 'https://www.getambassador.io/');
