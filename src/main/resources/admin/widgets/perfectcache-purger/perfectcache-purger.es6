import freemarker from '/lib/tineikt/freemarker';
import { purge, ban } from '../../../events';

const contentLib = require('/lib/xp/content');
const adminLib = require('/lib/xp/admin');
const httpClient = require('/lib/http-client');

function prettifyPurgeResponse(status) {
	let pretty = "";
	for (var i = 0; i < status.length; i++) {
		const response = status[i];
		pretty += `<p><span style="display: block; font-weight: bold;">${response.server}</span>${response.message}</p>`;
	}
	return pretty;
}

exports.get = function (req) {
	const { action, contentId } = req.params;

	if (action && contentId) {
		let status;
		switch (action) {
			case 'PURGE':
				const purgeResponse = purge(`con-${contentId}`);
				status = prettifyPurgeResponse(purgeResponse);
				break;
			case 'BAN':
				const path = contentLib.get({ key: contentId })._path;
				if (path) {
					const banResponse = ban(`${encodeURI(path)}(.*)`);
					status = prettifyPurgeResponse(banResponse);
				}
				break;
			default:
				log.warn(`Unknown action ${action}`);
		}
		return {
			body: status
		}
	}

	const widgetBaseUrl = `${adminLib.getBaseUri({ type: 'absolute' })}/portal/admin/draft/_/widgets/${app.name}/perfectcache-purger/`;
    var view = resolve("perfectcache-purger.ftl");
	var model = {
		urlPurge: `${widgetBaseUrl}?action=PURGE&contentId=${contentId}`,
		urlBan: `${widgetBaseUrl}?action=BAN&contentId=${contentId}`,
		config: app.config
	};

	return {
		headers: {
			'Cache-Control': 'no-cache'
		},
		body: freemarker.render(view, model)
	};
};
