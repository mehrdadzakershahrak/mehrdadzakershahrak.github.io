---
layout: single
title: "Work"
description: "Selected AI systems, production ML, and robotics work."
permalink: /work/
classes: wide work-page
suppress_default_h1: true
---

{%- assign work_items = site.data.home_work -%}

<section class="eh-showcase eh-showcase--work">
  <section class="eh-showcase__hero eh-showcase__hero--plain" aria-labelledby="work-hero-title">
    <div class="eh-showcase__copy">
      <p class="eh-eyebrow">Work</p>
      <h1 id="work-hero-title" class="eh-title">Selected systems work.</h1>
      <p class="eh-dek">
        Four concise, anonymized briefs across private deployment, AI runtime reliability, production ML, and human-AI or robot teaming.
      </p>
    </div>
  </section>

  <section class="eh-section eh-work-briefs" aria-labelledby="work-briefs-title">
    <h2 id="work-briefs-title">Project briefs</h2>

    <div class="eh-work-briefs__list">
      {%- for item in work_items -%}
        <article class="eh-work-brief" id="{{ item.title | slugify }}">
          <div class="eh-work-brief__head">
            {% include work_mark.html mark=item.mark %}
            <div>
              <p class="eh-eyebrow">{{ item.kind }}</p>
              <h3>{{ item.title }}</h3>
            </div>
          </div>

          <p>{{ item.brief }}</p>

          <ul>
            {%- for point in item.evidence -%}
              <li>{{ point }}</li>
            {%- endfor -%}
          </ul>
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
