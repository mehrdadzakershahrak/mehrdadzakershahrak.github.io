/**
 * A keyboard-accessible reveal gate for a static site. The encoded address
 * deters simple HTML scrapers; this browser-only check is not server CAPTCHA.
 * No address is stored in browser storage or revealed on a later visit.
 */
(function () {
  "use strict";

  var gate = document.querySelector("[data-email-gate]");
  if (!gate) return;
  var form = gate.querySelector("form");
  var answer = gate.querySelector("input");
  var question = gate.querySelector("[data-email-question]");
  var status = gate.querySelector('[role="status"]');
  var result = gate.querySelector("[data-email-result]");
  var expected;

  function newQuestion() {
    var left = Math.floor(Math.random() * 8) + 2;
    var right = Math.floor(Math.random() * 8) + 2;
    expected = left + right;
    question.textContent = "What is " + left + " plus " + right + "?";
    answer.value = "";
    answer.removeAttribute("aria-invalid");
    status.textContent = "";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (answer.value.trim() === "" || Number(answer.value) !== expected) {
      status.textContent = "That answer isn't right. Try again, or choose a new question.";
      answer.setAttribute("aria-invalid", "true");
      answer.focus();
      return;
    }
    try {
      var address = window.atob(gate.getAttribute("data-contact-address"));
      result.textContent = address;
      result.href = "mailto:" + address;
      form.hidden = true;
      result.hidden = false;
      status.textContent = "Email address revealed.";
      result.focus();
    } catch (error) {
      status.textContent = "Unable to reveal the address. Please contact me on LinkedIn.";
    }
  });

  gate.querySelector("[data-email-refresh]").addEventListener("click", function () {
    newQuestion();
    answer.focus();
  });
  newQuestion();
  form.hidden = false;
})();
