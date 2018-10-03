# <a href="https://www.tine.no/"><img src="https://webfiles.tine.no/Logo/TINE-logo.svg" alt="TINE Logo" width="70" align="right"></a> xp-app-perfectcache-purger

App that sends purge requests to varnish when content is published in Content Studio

## Prerequisite
You need to have a Varnish server running with the xkey vmod that is included in the [varnish-modules](https://github.com/varnish/varnish-modules) and configured to allow purge requests from the XP server.

```vcl
import xkey;

acl purge {
		"localhost";
		"1.3.3.7"; 
}

sub vcl_recv {
	if (req.method == "PURGE") {
		if (client.ip !~ purge) {
			return(synth(403, "Client IP" + client.ip + " not in PURGE list"));
		}
		set req.http.n-gone = xkey.purge(req.http.xkey);
		return (synth(200, "Invalidated " + req.http.n-gone + " objects"));
	}
}
```

You also have to handle setting the xkey header on your response with the keys with proper prefix.
We strongly suggest you use the [perfectcache-lib](https://github.com/tineikt/xp-lib-perfectcache) to assist you and keep consistent with `con-`, `cat-` and `tag-` prefix.

### optional
Use the [re vmod](https://code.uplex.de/uplex-varnish/libvmod-re) to add xkeys to images and other content that isn't passed through any XP controller/responsefilters.

```vcl
import re;

sub vcl_backend_response {
	if(reImageUrl.match(bereq.url)) {
		set beresp.http.xkey = "con-" + reImageUrl.backref(1);
	}
}
```
This partial config will add xkey in the format `con-83397779-e7ab-42a5-a50f-44f18e31da68` for an image served by Enonic XP that have the id `83397779-e7ab-42a5-a50f-44f18e31da68`.


## Installation

**NOTE: In current XP version 6.14.4 there is a bug where main.js doesn't have access to app.config, so this is just pseudo documentation atm**
Create a `no.tine.xp.perfectcache.purger.cfg` and add the setting to point to your Varnish server.

```
varnish.url = http://localhost:80
```

When config is in place... checkout and use gradle to build and deploy.

## What, why and how is things purged?

The XP app backend is responsible for returning a xkey header telling Varnish about dependencies on that specific page.
There are three types of prefix on the xkey's that affects how purging will be done:

`con-${guid}`, dependent on a content.

`cat-${guid}`, dependent on a category

`tag-${guid}`, dependent on a tag

When a `node.published` or `node.deleted` is sent from **Content Studio** this app will send purge requests based on the following logic.

### node.published ###
The following keys will be purged
`con-${publishedNodeId} cat-${publishedNodeId}`

...also attempt to purge the parent with:
`con-${publishedNodeParentId}`

...and look if the content have one or several tags in the structure used at *TINE SA* using x-data. It will look for IDs at `content.x.appName.tags.conTag` and if it is tagged also purge these with:
`tag-${publishedNodeTagsId}`

### node.deleted ###
The following keys will be purged
`con-${publishedNodeId} cat-${publishedNodeId} tag-${publishedNodeId}`
