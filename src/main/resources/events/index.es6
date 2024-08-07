import * as contentLib from '/lib/xp/content';
import httpClient from '/lib/http-client';

export function handlePushedEvent(eventNode) {
	logEvent(eventNode);

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
	log.info('LogEvent() event: %s', eventNode);
}

export function handleApplicationEvent(eventData) {
	if (eventData.eventType === 'INSTALLED') {
		log.info('Usually this is where we ban all sites but we have now turned this off! 2023.12.26');	
	}
}

function getTagsFromContent(eventNode) {
	log.info('Getting tags from content %s', JSON.stringify(eventNode));
	const content = contentLib.get({ key: eventNode.id });

	const tags = [];
	if (content && content.x) {
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
	} else {
		log.info('Content was not found!');
	}

	log.info('Tags found: %s', tags);

	return tags;
}

export function purge(xkey) {
	let responses = [];
	const urlToVarnish = (app.config['varnish.url'] || '').split(',');
	for (var i = 0; i < urlToVarnish.length; i++) {
		try {
			const response = httpClient.request({
				url: urlToVarnish[i],
				method: 'PURGE',
				headers: {
					xkey
				},
				connectionTimeout: 10000,
				readTimeout: 5000
			});
			log.info(`Varnish Purge Respone from ${urlToVarnish[i]} for xkey ${xkey} is  %s`, response.message);
			responses.push({ server: urlToVarnish[i], message: response.message });
		} catch (e) {
			log.error(`Varnish Purge Request Failed: %s`, e)
		}
	}
	return responses;
}

export function ban(path) {
	let responses = [];
	const urlToVarnish = (app.config['varnish.url'] || '').split(',');
	for (var i = 0; i < urlToVarnish.length; i++) {
		try {
			const response = httpClient.request({
				url: urlToVarnish[i],
				method: 'BAN',
				headers: {
					'xp-content-path': path
				},
				connectionTimeout: 10000,
				readTimeout: 5000
			});
			log.info(`Varnish Ban Respone from ${urlToVarnish[i]} for path ${path} is %s`, response.message);
			responses.push({ server: urlToVarnish[i], message: response.message });
		} catch (e) {
			log.error(`Varnish Ban Request Failed: %s`, e)
		}
	}
	return responses;
}
