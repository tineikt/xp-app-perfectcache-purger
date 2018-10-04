import contentLib from '/lib/xp/content';

const httpClient = require('/lib/http-client');

export function handlePushedEvent(eventNode) {
	let xkey = `con-${eventNode.id} cat-${eventNode.id}`;

	// Also purge parent content
	const eventNodeParent = `/${eventNode.path.split('/').splice(2, eventNode.path.split('/').length - 3).join('/')}`;
	const parent = contentLib.get({ key: eventNodeParent });
	if(parent) {
		xkey = `${xkey} cat-${parent._id}`;
	}

	// Handle moved content
	if(eventNode.currentTargetPath) {
		const eventNodeParent = `/${eventNode.currentTargetPath.split('/').splice(2, eventNode.currentTargetPath.split('/').length - 3).join('/')}`;
		const parent = contentLib.get({ key: eventNodeParent });
		if(parent) {
			xkey = `${xkey} cat-${parent._id}`;
		}
	}

	const tags = getTagsFromContent(eventNode);
	if(tags.length) {
		xkey = `${xkey} ${tags.map(t => `tag-${t}`).join(' ')}`;
	}
	purge(xkey);
}

export function handleDeletedEvent(eventNode) {
	let xkey = `con-${eventNode.id} cat-${eventNode.id} tag-${eventNode.id}`;
	purge(xkey);
}

export function logEvent(eventNode) {
	log.info('event: %s', eventNode);
}

function getTagsFromContent(eventNode) {
	const content = contentLib.get({ key: eventNode.id });
	const tags = [];
	if (content.x) {
		Object.keys(content.x).forEach(function(key) {
			try {
				const contentTag = content.x[key].tags.conTag;
				if (Array.isArray(contentTag)) {
					tags.push(...contentTag);
				} else {
					tags.push(contentTag);
				}
			} catch (e) {
				// No tags on that app namespace
			}
		});
	}
	return tags;
}

function purge(xkey) {
	const urlToVarnish = (app.config['varnish.url'] || 'http://localhost').split(',');
	for (var i = 0; i < urlToVarnish.length; i++) {
		try {
			const response = httpClient.request({
				url: urlToVarnish[i],
				method: 'PURGE',
				headers: {
					xkey
				},
				connectionTimeout: 1000,
				readTimeout: 2000
			});
			log.info('Varnish Purge Respone: %s', response.message);
		} catch (e) {
			log.error(`Varnish Purge Request Failed: %s`, e)
		}
	}
}
