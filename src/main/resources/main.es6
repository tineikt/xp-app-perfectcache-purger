import eventLib from '/lib/xp/event';
import contextLib from '/lib/xp/context';

import {logEvent, handleDeletedEvent, handlePushedEvent } from './events';


log.info('Add event listeners for Varnish Purging');
eventLib.listener({
	type: 'node.*',
	callback: (event) => {
		if (event.localOrigin) {
			const eventNodes = getObjectValue(event, 'data', 'nodes') || [];
			eventNodes
				.filter(eventNode => isPublished(eventNode))
				.forEach(eventNode => handle(event, eventNode));
		}
	}
});

export function getObjectValue(obj, prop, ...props) {
	let property = prop;
	let currentObj = obj;
	while (currentObj[property] && props.length > 0) {
		const temp = currentObj[property];
		property = props.shift();
		currentObj = temp;
	}
	if (props.length > 0) {
		return undefined;
	}
	return currentObj[property];
}

function isPublished(node) {
	return node.branch === 'master' && node.repo === 'cms-repo';
}

function handle(event, eventNode) {
	contextLib.run({
		user: {
			login: 'su'
		}
	}, () => {
		switch (event.type) {
			case 'node.created':
			case 'node.moved':
			case 'node.renamed':
			case 'node.updated':
			case 'node.deleted':
				return handleDeletedEvent(eventNode);
			case 'node.pushed':
				return handlePushedEvent(eventNode);
			default:
				return log.error(`>> Not handling event of type ${event.type}`);
		}
	});
}
