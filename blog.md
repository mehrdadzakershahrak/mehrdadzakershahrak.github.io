---
layout: default
title: Blog
permalink: /blog/
---

<h1>Blog Posts</h1>

{% for post in paginator.posts %}
  <article>
    <h2><a href="{{ post.url }}">{{ post.title }}</a></h2>
    <p class="meta">{{ post.date | date: "%B %-d, %Y" }}</p>
    {{ post.excerpt }}
    <p><a href="{{ post.url }}">Read more...</a></p>
  </article>
{% endfor %}

{% if paginator.total_pages > 1 %}
<div class="pagination">
  {% if paginator.previous_page %}
    <a href="{{ paginator.previous_page_path }}">&laquo; Prev</a>
  {% endif %}

  {% for page in (1..paginator.total_pages) %}
    {% if page == paginator.page %}
      <em>{{ page }}</em>
    {% elsif page == 1 %}
      <a href="/blog/">{{ page }}</a>
    {% else %}
      <a href="{{ site.paginate_path | replace: ':num', page }}">{{ page }}</a>
    {% endif %}
  {% endfor %}

  {% if paginator.next_page %}
    <a href="{{ paginator.next_page_path }}">Next &raquo;</a>
  {% endif %}
</div>
{% endif %}