import * as eventLib from '/lib/xp/event';
import * as contextLib from '/lib/xp/context';

import {logEvent, handleDeletedEvent, handlePushedEvent, handleApplicationEvent } from './events';

eventLib.listener({
	type: 'node.*',
	localOnly: true,
	callback: (event) => {
		const eventNodes = getObjectValue(event, 'data', 'nodes') || [];
		eventNodes
			.filter(eventNode => isPublished(eventNode))
			.forEach(eventNode => handle(event, eventNode));
	}
});

eventLib.listener({
	type: 'application',
	localOnly: true,
	callback: (event) => {
		handleApplicationEvent(event.data);
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
	return node.branch === 'master' && node.repo.startsWith('com.enonic.cms');
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
