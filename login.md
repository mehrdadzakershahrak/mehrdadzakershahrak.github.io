---
layout: single
title: "Login"
permalink: /login/
classes: wide
lead_capture: true
---

This is not a paid login yet. For now, it’s a simple email capture so you can unlock the demo chat and I can share updates.

<div
  data-lead-capture
  data-leads-endpoint="{{ site.leads_endpoint | escape }}"
  data-turnstile-site-key="{{ site.turnstile_site_key | escape }}"
>
  <form data-lead-form>
    <p>
      <label for="lead-email"><strong>Email</strong></label><br/>
      <input id="lead-email" type="email" inputmode="email" autocomplete="email" required data-lead-email style="max-width: 520px; width: 100%; padding: 0.6rem 0.7rem; border-radius: 0.5rem; border: 1px solid rgba(0,0,0,0.18);" />
    </p>

    {% if site.turnstile_site_key and site.turnstile_site_key != "" %}
      <p data-lead-turnstile class="cf-turnstile" data-sitekey="{{ site.turnstile_site_key }}"></p>
    {% endif %}

    <p>
      <button class="btn btn--primary" type="submit">Continue</button>
    </p>
    <p data-lead-msg style="opacity: 0.9;"></p>
  </form>
</div>

After you save your email, try the demos: [Industry AI]({{ '/industry-ai/' | relative_url }})
