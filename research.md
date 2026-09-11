---
layout: single
title: "AI & Human–Robot Interaction Research"
description: "Explore Mehrdad Zaker’s research in explainable AI, human–robot teaming, personalized summarization, efficient language models, and hardware trust."
permalink: /research/
classes: wide research-page
suppress_default_h1: true
---

{%- assign research_projects = site.data.research -%}
{%- assign scholar_url = "https://scholar.google.com/citations?user=Y_-UFnUAAAAJ&hl=en" -%}

<section class="eh-research">
  <header class="eh-research__hero" aria-labelledby="research-title">
    <div class="eh-research__intro">
      <p class="eh-eyebrow">Research portfolio</p>
      <h1 id="research-title" class="eh-title">Research by Mehrdad Zaker</h1>
      <p class="eh-dek">
        I study how people and intelligent systems can plan, explain, learn, and adapt together—from human–robot teams and personalized summaries to efficient language models and hardware trust.
      </p>
    </div>

    <aside class="eh-research-profile" aria-label="Research profile">
      <p class="eh-research-profile__label">Publication record</p>
      <div class="eh-research-profile__stats">
        <p><strong>350+</strong><span>citations</span></p>
        <p><strong>10</strong><span>h-index</span></p>
      </div>
      <p class="eh-research-profile__venues">ICRA · IROS · IEEE Access · ICWS · IJCNN</p>
      <a class="eh-research-profile__link" href="{{ scholar_url | escape }}" rel="noopener">
        View Google Scholar <span aria-hidden="true">↗</span>
      </a>
    </aside>
  </header>

  <section class="eh-research__stories" aria-labelledby="research-projects-title">
    <div class="eh-research__section-head">
      <p class="eh-eyebrow">Five connected programs</p>
      <h2 id="research-projects-title">Selected research projects</h2>
      <p>Each visual is an editorial interpretation of the idea behind the work; the paper links lead to the research record.</p>
    </div>

    <div class="eh-research-list">
      {%- for project in research_projects -%}
        <article class="eh-research-story" id="{{ project.title | slugify }}">
          <figure class="eh-research-story__media">
            <img
              src="{{ project.image | relative_url }}"
              alt="{{ project.image_alt | escape }}"
              width="900"
              height="900"
              loading="lazy"
              decoding="async">
          </figure>

          <div class="eh-research-story__copy">
            <p class="eh-research-story__meta">{{ project.period }} · {{ project.field }}</p>
            <h2>{{ project.title }}</h2>
          </div>

          <p class="eh-research-story__summary">{{ project.summary }}</p>

          <div class="eh-research-story__papers">
            <p class="eh-research-story__papers-label">Selected papers</p>
            <ul>
              {%- for paper in project.papers -%}
                <li>
                  <a href="{{ paper.url | escape }}" rel="noopener">
                    <span>{{ paper.title }}</span>
                    <small class="eh-paper-meta">
                      <span class="eh-paper-tag eh-paper-tag--venue">{{ paper.venue }}</span>
                      <span class="eh-paper-tag eh-paper-tag--year" data-year="{{ paper.year }}">{{ paper.year }}</span>
                      <span class="eh-paper-meta__arrow" aria-hidden="true">↗</span>
                    </small>
                  </a>
                </li>
              {%- endfor -%}
            </ul>
          </div>
        </article>
      {%- endfor -%}
    </div>
  </section>

  <aside class="eh-research__thread" aria-label="Research through-line">
    <p class="eh-eyebrow">The through-line</p>
    <p>Across hardware, robots, language, and learning, the question stays consistent: how do we make intelligent systems capable enough to act—and legible enough for people to inspect, steer, and trust?</p>
    <a href="{{ scholar_url | escape }}" rel="noopener">See the complete publication list on Google Scholar <span aria-hidden="true">↗</span></a>
  </aside>
</section>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": {{ page.title | jsonify }},
  "description": {{ page.description | jsonify }},
  "url": {{ page.url | absolute_url | jsonify }},
  "author": {
    "@type": "Person",
    "name": "Mehrdad Zakershahrak",
    "alternateName": "Mehrdad Zaker",
    "sameAs": [{{ scholar_url | jsonify }}]
  },
  "hasPart": [
    {%- for project in research_projects -%}
      {
        "@type": "CreativeWork",
        "name": {{ project.title | jsonify }},
        "description": {{ project.summary | jsonify }},
        "image": {{ project.image | absolute_url | jsonify }},
        "subjectOf": [
          {%- for paper in project.papers -%}
            {
              "@type": "ScholarlyArticle",
              "headline": {{ paper.title | jsonify }},
              "datePublished": {{ paper.year | jsonify }},
              "url": {{ paper.url | jsonify }}
            }{% unless forloop.last %},{% endunless %}
          {%- endfor -%}
        ]
      }{% unless forloop.last %},{% endunless %}
    {%- endfor -%}
  ]
}
</script>
