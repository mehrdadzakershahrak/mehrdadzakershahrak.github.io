---
layout: default
title: Blog
permalink: /blog/
---

<h1>Blog Posts</h1>

{% for post in site.posts %}
  <article>
    <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
    <p class="meta">{{ post.date | date: "%B %-d, %Y" }}</p>
    {{ post.excerpt }}
    <p><a href="{{ post.url | relative_url }}">Read more...</a></p>
  </article>
{% endfor %}