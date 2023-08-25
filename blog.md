
---
layout: page
title: Blog
permalink: /blog/
---

# Blog Posts

{% for post in site.posts %}
### [{{ post.title }}]({{ post.url }})
{{ post.excerpt | strip_html | truncatewords: 20 }}
[Read More]({{ post.url }})
<br><br>
{% endfor %}
