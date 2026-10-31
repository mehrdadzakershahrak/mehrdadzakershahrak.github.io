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
      <h1 id="work-hero-title" class="eh-title">Index, Koto, and LinkedFull</h1>
      <p class="eh-dek">
        Selected products, research code, and the engineering behind them.
      </p>
      <nav class="mz-work-nav" aria-label="Work sections">
        <a href="#project-cases-title">Projects</a>
        <a href="#work-briefs-title">Experience</a>
        <a href="#open-source-title">Open source</a>
      </nav>
    </div>
  </section>

  <section class="mz-project-cases" aria-labelledby="project-cases-title">
    <h2 id="project-cases-title" tabindex="-1">Project notes</h2>
    {%- for project in site.data.projects -%}
      <article class="mz-project-case" id="{{ project.id }}" aria-labelledby="{{ project.id }}-title">
        <div class="mz-project-case__heading">
          <img src="{{ project.image | relative_url }}" alt="{{ project.image_alt | escape }}" width="160" height="120" loading="lazy" decoding="async">
          <h3 id="{{ project.id }}-title">{{ project.title }}</h3>
        </div>
        <div class="mz-project-case__body">
          <h4>{{ project.focus }}</h4>
          <p>{{ project.problem }}</p>
          <p>{{ project.approach }}</p>
          <p class="mz-project-case__source"><a href="{{ project.source_url }}" rel="noopener">{{ project.source_label }}</a></p>
        </div>
        {%- if project.result -%}
          <aside class="mz-project-result" aria-label="Index parsing evaluation">
            <strong>{{ project.result }}</strong>
            <p>{{ project.result_label }}</p>
            <small>{{ project.result_note }}</small>
          </aside>
        {%- elsif project.detail_image -%}
          <figure class="mz-project-screen">
            <img src="{{ project.detail_image | relative_url }}" alt="{{ project.detail_image_alt | escape }}" width="221" height="480" loading="lazy" decoding="async">
            <figcaption>From the published iPhone app.</figcaption>
          </figure>
        {%- endif -%}
      </article>
    {%- endfor -%}
  </section>

  <section class="eh-section eh-work-briefs" aria-labelledby="work-briefs-title">
    <h2 id="work-briefs-title" tabindex="-1">Experience and research</h2>

    <div class="eh-work-briefs__list">
      {%- for item in work_items -%}
        <article class="eh-work-brief" id="{{ item.title | slugify }}" aria-labelledby="{{ item.title | slugify }}-title">
          <div class="eh-work-brief__head">
            {% include work_mark.html mark=item.mark %}
            <div>
              <h3 id="{{ item.title | slugify }}-title">{{ item.title }}</h3>
              <p class="mz-work-meta"><span>{{ item.year }}</span><span>{{ item.kind | replace: ' · ', ', ' }}</span></p>
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

  <section class="mz-open-source" aria-labelledby="open-source-title">
    <h2 id="open-source-title" tabindex="-1">Open-source research and experiments</h2>
    <p>Selected repositories pinned on my GitHub profile, from research implementations to early explorations.</p>
    <div class="mz-repo-grid">
      {%- for repo in site.data.open_source -%}
        <a class="mz-repo-card" href="{{ repo.url }}" rel="noopener">
          <img src="{{ repo.image | relative_url }}" alt="" width="600" height="300" loading="lazy" decoding="async">
          <h3>{{ repo.title }}</h3>
          <p>{{ repo.description }}</p>
          <span>{{ repo.note }}</span>
        </a>
      {%- endfor -%}
    </div>
  </section>

  <section class="eh-work-contact" aria-label="Contact">
    <p>
      For technical roles, collaborations, or an AI project, email
      <a href="{{ '/contact/#email' | relative_url }}" data-analytics="cta_contact_click" data-analytics-source="work">Mehrdad</a>.
    </p>
  </section>
</section>
