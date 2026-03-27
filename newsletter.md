---
layout: single
title: "Newsletter"
permalink: /newsletter/
classes: wide
---

Get updates on new demos, deployments, and releases.

{% if site.substack_subscribe_url and site.substack_subscribe_url != "" %}
  <p><a class="btn btn--primary" href="{{ site.substack_subscribe_url }}" target="_blank" rel="noopener noreferrer">Subscribe on Substack</a></p>
  <iframe
    src="{{ site.substack_subscribe_url }}"
    width="100%"
    height="320"
    style="border:1px solid rgba(0,0,0,0.12); border-radius: 12px;"
  ></iframe>
{% else %}
  <p><strong>TODO:</strong> Set <code>substack_subscribe_url</code> in <code>_config.yml</code>.</p>
{% endif %}

Prefer to try the demos first? Start here: [Industry AI]({{ '/idx/assistant/' | relative_url }})
