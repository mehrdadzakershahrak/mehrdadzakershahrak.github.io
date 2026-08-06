---
layout: single
title: "Lady Support"
description: "Support and troubleshooting for the Zaker Works Lady family-routine app for iPhone."
permalink: /apps/lady/support/
classes: wide
---

Lady helps parents turn repeated reminders throughout the family day into
scheduled Google Home announcements.

For help, email [{{ site.contact_email }}](mailto:{{ site.contact_email }}).
Include the Lady version, iOS version, iPhone model, and a short description of
what happened. Do not include passwords, OAuth credentials, or sensitive family
details.

## Quick checks

- **Google Home will not connect:** Confirm the iPhone is signed into the Google
  account that manages the Home, then grant a structure in the authorization
  flow. Development builds must use an approved OAuth test account.
- **No speakers appear:** Confirm the speaker is in the granted Home, online,
  and compatible with Google Assistant broadcasts.
- **A schedule is rejected:** Add a street address to the Home in the Google
  Home app, confirm the selected days and time, and try again.
- **A reminder does not play:** Use **Test now**, confirm the destination speaker
  is online and audible, and check that the routine is enabled.
- **Removing Lady did not remove a routine:** Delete the automation from Google
  Home. Uninstalling an app does not automatically delete cloud automations.

[Read the Lady Privacy Policy]({{ '/apps/lady/privacy/' | relative_url }}).
