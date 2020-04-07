#!/usr/bin/env node

const blc = require('broken-link-checker');
const path = require('path');

// list of directories in ambassador.git/docs
const ambassador_docs_dirs = [
	'about',
	'concepts',
	'doc-images',
	'docs',
	'edgestack.me',
	'kat',
	'reference',
	'user-guide',
	'yaml',
];

function main(siteURL) {

	const site = new URL(siteURL);
	const handleLink = function(result) {
		if (result.broken === true) {
			switch (result.url.original) {
			case "https://blog.getambassador.io/search?q=canary":
			case "https://app.datadoghq.com/apm/traces":
				break
			default:
				if (/^HTTP_5[0-9][0-9]$/.test(result.brokenReason)) {
					// skip
				} else if (result.brokenReason === 'HTTP_204' && (result.url.resolved.startsWith('https://www.youtube.com/') || result.url.resolved.startsWith('https://youtu.be/'))) {
					// skip
				} else if (result.brokenReason === 'HTTP_429' && (result.url.resolved.startsWith('https://www.youtube.com/') || result.url.resolved.startsWith('https://youtu.be/'))) {
					// skip
				} else if (result.brokenReason === 'HTTP_999' && result.url.resolved.startsWith('https://www.linkedin.com/')) {
					// skip
				} else if (result.html.tagName === 'link' && result.html.attrName === 'href' && result.html.attrs.rel === 'canonical' && (new URL(result.url.resolved)).pathname === (new URL(result.base.resolved)).pathname) {
					// skip
				} else if (result.html.text === 'Edit this page on GitHub') {
					// skip
				} else {
					console.log(`Page ${result.base.resolved} has a broken link: "${result.url.original}" (${result.brokenReason})`);
				}
			}
		} else if (result.url.resolved === null) {
			// skip
		} else if (result.html.tagName === 'link' && result.html.attrName === 'href' && result.html.attrs.rel === 'canonical') {
			// skip
		} else {
			let src = new URL(result.base.resolved);
			let dst = new URL(result.url.resolved);
			if (dst.hostname === 'blog.getambassador.io') {
				// skip
			} else if (dst.hostname.endsWith('getambassador.io') || dst.hostname.endsWith(site.hostname)) {
				// This is an internal link--validate that it's relative.
				let dstIsAbsolutePath = (result.url.original === result.url.resolved) || (result.url.original + '/' === result.url.resolved) || result.url.original.startsWith('/');
				let dstIsAbsoluteDomain = (result.url.original === result.url.resolved) || (result.url.original + '/' === result.url.resolved) || result.url.original.startsWith('//');
				let srcIsAmbassadorDocs = ambassador_docs_dirs.includes(src.pathname.split('/')[1]);
				let dstIsAmbassadorDocs = ambassador_docs_dirs.includes(dst.pathname.split('/')[1]);
				if (dstIsAbsoluteDomain) {
					// links within getambassador.io should not mention the scheme or domain
					// (this way, they work in netlify previews)
					let suggestion = dst.pathname + dst.hash;
					console.log(`Page ${result.base.resolved} has an ugly link: "${result.url.original}" has a domain (did you mean "${suggestion}"?)`);
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
		html: function(tree, robots, response, pageURL) {
			console.log("Processing", pageURL);
		},
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

	siteChecker.enqueue(siteURL);
	// pages that no other page links to... :(
	if (!siteURL.endsWith('/')) {
		siteURL += '/';
	}
};

main(process.argv.slice(2)[0] || 'https://www.getambassador.io/');
