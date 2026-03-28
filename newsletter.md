---
layout: single
title: "Newsletter"
permalink: /newsletter/
classes: wide
---

This page is reserved for future long-form updates on new guidance, deployments, and releases.

{% if site.substack_subscribe_url and site.substack_subscribe_url != "" %}
  <p><a class="btn btn--primary" href="{{ site.substack_subscribe_url }}" target="_blank" rel="noopener noreferrer">Subscribe on Substack</a></p>
  <iframe
    src="{{ site.substack_subscribe_url }}"
    width="100%"
    height="320"
    style="border:1px solid rgba(0,0,0,0.12); border-radius: 12px;"
  ></iframe>
{% else %}
  <p>Public newsletter subscriptions are not open right now. In the meantime, the best public updates are on the <a href="{{ '/podcast/' | relative_url }}">podcast</a> and across the main solutions pages.</p>
  <p>
    <a class="btn btn--primary mdz-cta" href="{{ '/podcast/' | relative_url }}">Browse the podcast</a>
    <a class="btn btn--small mdz-cta mdz-cta--outline" href="{{ '/contact/' | relative_url }}">Contact Mehrdad</a>
  </p>
{% endif %}
