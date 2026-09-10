---
layout: single
title: "Writing"
description: "Practical writing by Mehrdad Zaker on private AI deployment, factory robotics, production reliability, and system architecture."
permalink: /newsletter/
classes: wide
---

{% assign issues = site.ai_material | where: "content_type", "note" | sort: "date" | reverse %}
{% assign latest_issue = issues | first %}

Practical notes on AI systems, robotics, deployment architecture, and production reliability.

{% if latest_issue %}
## Selected writing

### [{{ latest_issue.title }}]({{ latest_issue.url | relative_url }})

{{ latest_issue.excerpt }}

{% if latest_issue.ui_tags %}
<p class="eh-chip-row">
  {% for tag in latest_issue.ui_tags limit: 3 %}
    <span class="eh-chip">{{ tag }}</span>
  {% endfor %}
</p>
{% endif %}

<p>
  <a class="eh-btn" href="{{ latest_issue.url | relative_url }}">Read the latest issue</a>
</p>
{% endif %}

{% if issues.size > 1 %}
## All earlier issues

{% for issue in issues offset: 1 %}
### [{{ issue.title }}]({{ issue.url | relative_url }})

{{ issue.excerpt }}

{% if issue.ui_tags %}
<p class="eh-chip-row">
  {% for tag in issue.ui_tags limit: 3 %}
    <span class="eh-chip">{{ tag }}</span>
  {% endfor %}
</p>
{% endif %}
{% endfor %}
{% endif %}

## Subscribe

{% if site.substack_subscribe_url and site.substack_subscribe_url != "" %}
  <p>Subscribe for new issues on applied AI, robotics, and production architecture.</p>
  <p><a class="eh-btn" href="{{ site.substack_subscribe_url }}" target="_blank" rel="noopener noreferrer">Subscribe on Substack</a></p>
  <iframe
    src="{{ site.substack_subscribe_url }}"
    width="100%"
    height="320"
    style="border:1px solid rgba(0,0,0,0.12); border-radius: 12px;"
  ></iframe>
{% else %}
  <p>For direct questions about a deployment, architecture review, or robotics workflow, use the contact page.</p>
  <p>
    <a class="eh-btn eh-btn--secondary" href="{{ '/contact/' | relative_url }}">Contact Mehrdad</a>
  </p>
{% endif %}
