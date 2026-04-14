---
layout: single
title: "Newsletter"
permalink: /newsletter/
classes: wide
---

{% assign latest_issue = site.newsletter_entries | sort: "date" | reverse | first %}

Practical notes on AI systems, robotics, deployment architecture, and product execution. This section now works as the public home for long-form updates and short issue-style essays.

{% if latest_issue %}
## Latest issue

### [{{ latest_issue.title }}]({{ latest_issue.url | relative_url }})

{{ latest_issue.excerpt }}

<p>
  <a class="btn btn--primary mdz-cta" href="{{ latest_issue.url | relative_url }}">Read the latest issue</a>
  <a class="btn btn--small mdz-cta mdz-cta--outline" href="{{ '/newsletter/archive/' | relative_url }}">Browse the archive</a>
</p>
{% endif %}

## Subscribe

{% if site.substack_subscribe_url and site.substack_subscribe_url != "" %}
  <p>Subscribe for new issues on applied AI, robotics, and production architecture.</p>
  <p><a class="btn btn--primary" href="{{ site.substack_subscribe_url }}" target="_blank" rel="noopener noreferrer">Subscribe on Substack</a></p>
  <iframe
    src="{{ site.substack_subscribe_url }}"
    width="100%"
    height="320"
    style="border:1px solid rgba(0,0,0,0.12); border-radius: 12px;"
  ></iframe>
{% else %}
  <p>Public subscriptions are not open yet, but the writing archive is now live. For direct questions about a deployment, architecture review, or robotics workflow, use the contact page.</p>
  <p>
    <a class="btn btn--primary mdz-cta" href="{{ '/newsletter/archive/' | relative_url }}">View the archive</a>
    <a class="btn btn--small mdz-cta mdz-cta--outline" href="{{ '/contact/' | relative_url }}">Contact Mehrdad</a>
  </p>
{% endif %}
