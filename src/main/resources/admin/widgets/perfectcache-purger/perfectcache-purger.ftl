<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Perfectcache Purger</title>
	<link href="https://fonts.googleapis.com/css?family=Open+Sans:400,600,700" rel="stylesheet" />
    <link rel="stylesheet" type="text/css" href="[@assetUrl path='css/perfectcache-purger.css' /]">
</head>
<body id="widget-pcp" class="widget-pcp">
	<div class="widget-pcp">
		<button data-purge-target="${urlPurge!'#'}" class="pcp-purge-action xp-admin-common-button">
			<span>Purge cache</span>
		</button>
		<button data-purge-target="${urlBan!'#'}" class="pcp-purge-action xp-admin-common-button">
			<span>Ban content and children</span>
		</button>
		<div id="pcp-purge-status" class="card card--hidden">

		</div>
		<div class="info card card--small">
			<h2 class="card__title">Purging against server(s)</h2>
			<div class="card__content">
				<ul class="serverlist">
				[#list ((config['varnish.url'])!"Missing")?split(",") as url]
				  <li class="server">${url!"missing"}</li>
				[/#list]
				</ul>
			</div>
		</div>
	</div>
	<script src="[@assetUrl path='js/perfectcache-purger.js' /]" type="text/javascript"></script>
</body>
</html>
