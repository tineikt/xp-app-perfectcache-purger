// Since widgets are included into page and not iframed runtime here is wierd...
(function () {
	const loadingIntervall = setInterval(() => {
		const actions = document.getElementsByClassName("pcp-purge-action");
		if (actions.length) {
			clearInterval(loadingIntervall);
			for (var i = 0; i < actions.length; i++) {
				actions[i].addEventListener('click', event => {
					const url = event.target.parentElement.getAttribute("data-purge-target");
					if (url) {
						purge(url);
					}
				});
			}
		}
	}, 200);
}());

const purgeInit = {
	method: 'GET',
	cache: 'no-cache',
	credentials: 'include'
}

function purge(url) {
	fetch(url, purgeInit)
	.then((response) => {
		response.text().then(text => {
			const statusEl = document.getElementById('pcp-purge-status');
			statusEl.classList.remove('card--hidden');
			statusEl.innerHTML = text;
		})
	});

}
