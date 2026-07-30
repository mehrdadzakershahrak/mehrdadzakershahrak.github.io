---
layout: single
title: "Work"
description: "Selected work across private and agentic AI, production ML, human–AI interaction, and robotics."
permalink: /work/
classes: wide work-page
suppress_default_h1: true
---

{%- assign work_items = site.data.home_work -%}

<section class="eh-showcase eh-showcase--work">
  <section class="eh-showcase__hero eh-showcase__hero--plain" aria-labelledby="work-hero-title">
    <div class="eh-showcase__copy">
      <p class="eh-eyebrow">Work and research</p>
      <h1 id="work-hero-title" class="eh-title">From research to production.</h1>
      <p class="eh-dek">
        A selected record of the systems I have built, the research I have published, and the technical work I lead now.
      </p>
    </div>
  </section>

  <section class="eh-section eh-work-briefs" aria-labelledby="work-briefs-title">
    <h2 id="work-briefs-title">Selected work</h2>

    <div class="eh-work-briefs__list">
      {%- for item in work_items -%}
        <article class="eh-work-brief" id="{{ item.title | slugify }}">
          <div class="eh-work-brief__head">
            {% include work_mark.html mark=item.mark %}
            <div>
              <p class="eh-eyebrow">{{ item.year }} · {{ item.kind }}</p>
              <h3>{{ item.title }}</h3>
            </div>
          </div>

          <p>{{ item.brief }}</p>

          <ul>
            {%- for point in item.evidence -%}
              <li>{{ point }}</li>
            {%- endfor -%}
          </ul>

          {%- if item.source_url -%}
            <p class="eh-work-brief__source">
              <a href="{{ item.source_url }}" rel="noopener">{{ item.source_label | default: "Source" }}</a>
            </p>
          {%- endif -%}
        </article>
      {%- endfor -%}
    </div>
  </section>

  <section class="eh-work-contact" aria-label="Contact">
    <p>
      For a concrete AI systems constraint, email
      <a href="mailto:{{ site.contact_email }}" data-analytics="cta_contact_click" data-analytics-source="work">{{ site.contact_email }}</a>.
    </p>
  </section>
</section>
