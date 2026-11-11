---
layout: single
title: "Toward a Unit of AI Inference: Auditing Resource-Ratio Calibration"
description: "Toward a unit of AI inference: an audit of resource-ratio calibration, outcome verification, and measurement boundaries in public LLM evaluation archives."
permalink: /research/resource-ratio-calibration/
classes: wide publication-page
eyebrow: "Research preprint · 2026"
date: 2026-11-11
publication_year: "2026"
scholarly_paper: true
paper_pdf: /research/resource-ratio-calibration/resource-ratio-calibration-preprint.pdf
scholarly_authors:
  - name: "Mehrdad Zakershahrak"
    institution: "Macquarie University"
  - name: "Samira Ghodratnama"
    institution: "Macquarie University"
---

**Mehrdad Zakershahrak and Samira Ghodratnama**<br>
School of Computing, Faculty of Science and Engineering, Macquarie University, Sydney, Australia

[Read the paper (PDF)]({{ page.paper_pdf | relative_url }}) · [Citation](#citation)

**Preprint · 2026**

## Abstract

Resource ratios between tasks offer a tempting way to normalize language-model efficiency across heterogeneous workloads. Such conversions require more than a close pooled fit: their meaning depends on acceptance rules, execution boundaries, reference systems, and the distribution of task comparisons. We audit these requirements in three public evaluation archives using local reanalysis. Across 81,438 matched Reasoning Gym first completions, median omitted-system reconstruction errors for visible response bytes are 2.308 and 2.596 in easy and hard settings; bytes omit separately returned reasoning. Independent exact arithmetic finds incorrect references for 28 of 50 hard decimal-sum questions, producing 117 archived rejections of exact correct answers. In a restricted METR panel of 6,996 runs, aggregate-token reconstruction lies within factor 1.25 for 75.8% of comparisons, with 67.3% coverage under exclusion of the held label's provider proxy; individual-system coverage ranges from 48.5% to 97.4%. An engineering release exposes outcome-dependent missing telemetry and aggregation sensitivity. Constructed studies distinguish taxonomy effects, sparse-bridge identification, and accounting-error bounds from empirical validation. The contribution is a reproducible audit of resource-ratio calibration and its failure modes. None of the archives identifies minimum resource cost at a common reliability target or validates a unit of useful inference work.

## Citation

Mehrdad Zakershahrak and Samira Ghodratnama. 2026. *Toward a Unit of AI Inference: Auditing Resource-Ratio Calibration*. Preprint.

```bibtex
@misc{zakershahrak2026auditing,
  title = {Toward a Unit of AI Inference: Auditing Resource-Ratio Calibration},
  author = {Zakershahrak, Mehrdad and Ghodratnama, Samira},
  year = {2026},
  note = {Preprint},
  url = {https://www.mehrdadzaker.com/research/resource-ratio-calibration/}
}
```

[All research]({{ '/research/' | relative_url }})

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ScholarlyArticle",
  "headline": {{ page.title | jsonify }},
  "url": {{ page.url | absolute_url | jsonify }},
  "datePublished": {{ page.publication_year | jsonify }},
  "creativeWorkStatus": "Preprint",
  "isAccessibleForFree": true,
  "inLanguage": "en",
  "author": [
    {% for author in page.scholarly_authors %}
    {
      "@type": "Person",
      "name": {{ author.name | jsonify }},
      "affiliation": {
        "@type": "Organization",
        "name": {{ author.institution | jsonify }}
      }
    }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ],
  "encoding": {
    "@type": "MediaObject",
    "contentUrl": {{ page.paper_pdf | absolute_url | jsonify }},
    "encodingFormat": "application/pdf"
  }
}
</script>
