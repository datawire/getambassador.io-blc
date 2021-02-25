#!/usr/bin/env node

const blc = require('broken-link-checker');

function main(siteURL) {

	const site = new URL(siteURL);
	const handleLink = function(result) {
		if (result.broken === true) {
			switch (result.url.original) {
			case "https://blog.getambassador.io/search?q=canary":
			case "https://app.datadoghq.com/apm/traces":
			case "https://www.chick-fil-a.com/":
				break
			default:
				if (/^HTTP_5[0-9][0-9]$/.test(result.brokenReason)) {
					// skip
				} else if (result.brokenReason === 'HTTP_204' && (result.url.resolved.startsWith('https://www.youtube.com/') || result.url.resolved.startsWith('https://youtu.be/'))) {
					// skip
				} else if (result.brokenReason === 'HTTP_429') {
					// skip
				} else if (result.brokenReason === 'HTTP_400' && (result.url.resolved.startsWith('https://twitter.com/') || result.url.resolved.startsWith('https://www.twitter.com/'))) {
					// skip
				} else if (result.brokenReason === 'HTTP_999' && result.url.resolved.startsWith('https://www.linkedin.com/')) {
					// skip
				} else if (result.brokenReason === 'HTTP_404' && result.url.resolved === 'https://github.com/datawire/project-template/generate') {
					// GitHub gives a 404 for 'generate' URLs unless you set the 'Accept:' header, and I don't know how to get broken-link-checker to set it.
					// skip
				} else if ((result.brokenReason === 'HTTP_undefined' || result.brokenReason === 'BLC_UNKNOWN') && (result.url.resolved.startsWith('https://www.haproxy.org/') || result.url.resolved.startsWith('http://verylargejavaservice'))) {
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
			let dst = new URL(result.url.resolved);
			if (dst.hostname.startsWith('blog') || dst.hostname.startsWith('app') || dst.hostname.startsWith('k8sinitializer')) {
				// skip
			} else if (dst.hostname.endsWith('getambassador.io') || dst.hostname.endsWith(site.hostname)) {
				// This is an internal link--validate that it's relative.
				let dstIsAbsoluteDomain = (result.url.original === result.url.resolved) || (result.url.original + '/' === result.url.resolved) || result.url.original.startsWith('//');
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
		requestMethod: "get", // instead of "head"; redis.io responds with a 404 to all HEAD requests (and the
				      // most recent stable release of broken-link-checker still doesn't have the
				      // retryHeadCodes setting that is on 'master')
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
