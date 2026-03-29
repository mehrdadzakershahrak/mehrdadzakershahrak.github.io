---
---
var store = [
  {% assign searchable_pages = site.html_pages | where_exp: "page", "page.search != false" %}
  {% assign searchable_pages = searchable_pages | where_exp: "page", "page.url != '/search/'" %}
  {% assign searchable_pages = searchable_pages | where_exp: "page", "page.url != '/404.html'" %}
  {% assign searchable_pages = searchable_pages | where_exp: "page", "page.layout != 'redirect'" %}
  {% assign searchable_docs = site.documents | where_exp: "doc", "doc.output != false" %}
  {% assign searchable_docs = searchable_docs | where_exp: "doc", "doc.search != false" %}
  {% assign searchable_docs = searchable_docs | where_exp: "doc", "doc.layout != 'redirect'" %}
  {% assign page_total = searchable_pages | size %}
  {% assign doc_total = searchable_docs | size %}
  {% assign total_items = page_total | plus: doc_total %}
  {% assign item_index = 0 %}
  {% for page in searchable_pages %}
    {% assign title = page.title | default: page.url %}
    {% assign excerpt = page.excerpt | default: page.content %}
    {% assign teaser = page.header.teaser | default: page.teaser %}
    {
      "title": {{ title | jsonify }},
      "excerpt": {{ excerpt | markdownify | strip_html | strip_newlines | normalize_whitespace | jsonify }},
      "content": {{ page.content | markdownify | strip_html | strip_newlines | normalize_whitespace | jsonify }},
      "categories": {{ page.categories | jsonify }},
      "tags": {{ page.tags | jsonify }},
      "url": {{ page.url | relative_url | jsonify }},
      "teaser": {% if teaser %}{{ teaser | relative_url | jsonify }}{% else %}null{% endif %}
    }{% assign item_index = item_index | plus: 1 %}{% if item_index < total_items %},{% endif %}
  {% endfor %}
  {% for doc in searchable_docs %}
    {% assign title = doc.title | default: doc.url %}
    {% assign excerpt = doc.excerpt | default: doc.content %}
    {% assign teaser = doc.header.teaser | default: doc.teaser %}
    {
      "title": {{ title | jsonify }},
      "excerpt": {{ excerpt | markdownify | strip_html | strip_newlines | normalize_whitespace | jsonify }},
      "content": {{ doc.content | markdownify | strip_html | strip_newlines | normalize_whitespace | jsonify }},
      "categories": {{ doc.categories | jsonify }},
      "tags": {{ doc.tags | jsonify }},
      "url": {{ doc.url | relative_url | jsonify }},
      "teaser": {% if teaser %}{{ teaser | relative_url | jsonify }}{% else %}null{% endif %}
    }{% assign item_index = item_index | plus: 1 %}{% if item_index < total_items %},{% endif %}
  {% endfor %}
];
