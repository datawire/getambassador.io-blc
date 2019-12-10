#!/usr/bin/env node

const blc = require('broken-link-checker');
const path = require('path');

// list of directories in ambassador-docs.git
const ambassador_docs_dirs = [
	'about',
	'concepts',
	'doc-images',
	'docs',
	'kat',
	'reference',
	'user-guide',
	'yaml',
];

function main(siteURL) {

	const site = new URL(siteURL);
	const handleLink = function(result) {
		if (result.broken === true) {
			console.log(`Page ${result.base.resolved} has a broken link: "${result.url.original}" (${result.brokenReason})`);
		} else if (result.url.resolved === null) {
			// skip
		} else {
			let src = new URL(result.base.resolved);
			let dst = new URL(result.url.resolved);
			if (dst.hostname === 'blog.getambassador.io') {
				// skip
			} else if (dst.hostname.endsWith('getambassador.io') || dst.hostname.endsWith(site.hostname)) {
				// This is an internal link--validate that it's relative.
				let dstIsAbsolutePath = (result.url.original === result.url.resolved) || result.url.original.startsWith('/');
				let dstIsAbsoluteDomain = (result.url.original === result.url.resolved) || result.url.original.startsWith('//');
				let srcIsAmbassadorDocs = ambassador_docs_dirs.includes(src.pathname.split('/')[1]);
				let dstIsAmbassadorDocs = ambassador_docs_dirs.includes(dst.pathname.split('/')[1]);
				if (srcIsAmbassadorDocs && dstIsAmbassadorDocs && dstIsAbsolutePath) {
					let suggestion = path.relative(src.pathname.replace(/\/[^/]*$/, '/'), dst.pathname) + dst.hash;
					if (suggestion === "") {
						console.log(`Page ${result.base.resolved} has an ugly link: "${result.url.original}" is the same page it's already on!`);
					} else {
						console.log(`Page ${result.base.resolved} has an ugly link: "${result.url.original}" is an absolute path (did you mean "${suggestion}"?)`);
					}
				} else if (dstIsAbsoluteDomain) {
					console.log(`Page ${result.base.resolved} has an ugly link: "${result.url.original}" has a domain (did you mean "${dst.path + dst.hash}"?)`);
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
	siteChecker.enqueue(siteURL+'about/roadmap');
	siteChecker.enqueue(siteURL+'docs');
	siteChecker.enqueue(siteURL+'docs/test-in-prod');
	siteChecker.enqueue(siteURL+'libraries');
	siteChecker.enqueue(siteURL+'reference/config-format');
	siteChecker.enqueue(siteURL+'reference/core/annotations');
	siteChecker.enqueue(siteURL+'reference/pro/authentication');
	siteChecker.enqueue(siteURL+'reference/pro/environment');
	siteChecker.enqueue(siteURL+'reference/upgrading');
	siteChecker.enqueue(siteURL+'user-guide/config-ambassador');
	siteChecker.enqueue(siteURL+'user-guide/consul-connect-ambassador');
	siteChecker.enqueue(siteURL+'user-guide/developers');
	siteChecker.enqueue(siteURL+'user-guide/downloads');
	siteChecker.enqueue(siteURL+'user-guide/enabling-authentication');
	siteChecker.enqueue(siteURL+'user-guide/incremental-migration-ambassador');
	siteChecker.enqueue(siteURL+'user-guide/kubernetes-integration');
	siteChecker.enqueue(siteURL+'user-guide/operators');
	siteChecker.enqueue(siteURL+'user-guide/protocol-support-ambassador');
	siteChecker.enqueue(siteURL+'user-guide/service-mesh-integration');
};

main(process.argv.slice(2)[0] || 'https://www.getambassador.io/');
