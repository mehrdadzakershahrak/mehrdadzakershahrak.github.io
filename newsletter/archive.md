---
layout: single
title: "Newsletter Archive"
permalink: /newsletter/archive/
classes: wide
---

{% assign issues = site.ai_material | where: "content_type", "note" | sort: "date" | reverse %}

## Archive

{% if issues.size > 2 %}
{% for issue in issues offset: 2 %}
### [{{ issue.title }}]({{ issue.url | relative_url }})

{{ issue.date | date: "%B %-d, %Y" }}

{{ issue.excerpt }}
{% endfor %}
{% else %}
Older archive entries will appear here once more issues are published. The two newest newsletter entries stay on the main [Newsletter]({{ '/newsletter/' | relative_url }}) page.
{% endif %}

To return to the main newsletter hub, go to [Newsletter]({{ '/newsletter/' | relative_url }}).
