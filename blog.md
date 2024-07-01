---
layout: page
title: Blog
permalink: /blog/
---

<h1>Blog Posts</h1>

{% for post in site.posts %}
  <article style="margin-bottom: 30px; border-bottom: 1px solid #e8e8e8; padding-bottom: 20px;">
    <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
    <p style="color: #828282; font-size: 0.9em; margin-bottom: 10px;">{{ post.date | date: "%B %-d, %Y" }}</p>
    {{ post.excerpt }}
    <p><a href="{{ post.url | relative_url }}">Read more...</a></p>
  </article>
{% endfor %}