---
layout: single
title: "Contact"
description: "Contact Mehrdad Zaker about trustworthy AI systems, production ML, robotics, or technical direction."
permalink: /contact/
classes: wide
suppress_default_h1: true
email_gate: true
---

<section class="eh-contact-page">
  <section class="eh-showcase__hero" aria-labelledby="contact-title">
    <div class="eh-showcase__copy">
      <p class="eh-eyebrow">Contact</p>
      <h1 id="contact-title" class="eh-title">Bring a concrete systems problem.</h1>
      <p class="eh-dek">
        The best fit is work involving private or agentic AI, production ML, robotics, or technical direction where reliability and operational fit matter.
      </p>
      <div class="eh-action-row">
        <a class="eh-btn" href="{{ '/contact/#email' | relative_url }}">Email Mehrdad</a>
        <a class="eh-btn eh-btn--secondary" href="{{ '/work/' | relative_url }}">View work</a>
      </div>
    </div>
  </section>

  <section id="email" class="eh-email-gate" aria-label="Email verification" data-email-gate data-contact-address="{{ site.data.contact.address_encoded }}">
    <h2>Reveal my email</h2>
    <p id="email-check-hint">Answer a quick question to reveal my email address.</p>
    <form class="eh-email-gate__form" hidden>
      <label for="email-check-answer" data-email-question></label>
      <input id="email-check-answer" name="answer" type="number" inputmode="numeric" min="0" max="99" step="1" required autocomplete="off" aria-describedby="email-check-hint email-check-status">
      <div class="eh-email-gate__controls">
        <button class="eh-btn" type="submit">Reveal email</button>
        <button class="eh-link" type="button" data-email-refresh>New question</button>
      </div>
    </form>
    <p id="email-check-status" role="status" aria-live="polite"></p>
    <a class="eh-link eh-email-gate__result" data-email-result hidden></a>
    <noscript><p>Enable JavaScript to reveal my email, or <a href="https://www.linkedin.com/in/mehrdadzaker">contact me on LinkedIn</a>.</p></noscript>
  </section>

  <div class="eh-card-grid">
    <section class="eh-card">
      <h2>Good reasons to reach out</h2>
      <ul>
        <li>LLM or retrieval systems that need clearer architecture</li>
        <li>Agentic workflows that need evaluation, guardrails, or governance</li>
        <li>Production ML workflows with reliability or evaluation gaps</li>
        <li>Robotics or automation systems that need stronger AI integration</li>
        <li>Technical leadership for a high-stakes AI build</li>
      </ul>
    </section>

    <section class="eh-card">
      <h2>What to include</h2>
      <ul>
        <li>Your workflow or use case</li>
        <li>The deployment, privacy, or reliability constraints that matter</li>
        <li>The current stage of the system</li>
        <li>The decision, deliverable, or next step you need</li>
      </ul>
    </section>
  </div>

  <section class="eh-panel">
    <h2>Response framing</h2>
    <p>
      The goal of the first exchange is to determine fit quickly and keep the conversation technically grounded. Expect a concise response oriented around scope, next steps, or the fastest way to get useful signal on the problem.
    </p>
    <p>
      Email <a href="{{ '/contact/#email' | relative_url }}">Mehrdad</a> when you are ready.
    </p>
  </section>
</section>
