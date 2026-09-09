# UAE/KSA edge AI site readiness before you pick a box

Map scene, connectivity, power, and who reviews exceptions on the real UAE/KSA site before selecting edge hardware or signing acceptance.

This page is a Gulf-named readiness checklist that extends the generic [edge AI site survey](/resources/edge-ai-survey). It is a method, not a product catalog. It does not run checkout, invent latency numbers, or rank brands. It is not legal advice and not a PDPL opinion. Escalate legal and privacy questions to counsel.

## Why the site beats the model brochure

A model card answers what a network can do on a chosen dataset. A UAE or KSA site answers whether a person will see an event, receive a usable alert, and know what to do next. Hardware selected from a brochure inherits lighting, field of view, heat, power, and the review chain of the yard, gate, warehouse, or floor you actually operate.

Write one observable task before anyone talks SKUs. Name the object or event, the operational decision, and the errors you will not accept. “AI cameras for the site” is not a requirement. A named reviewer in Dubai or Riyadh who can act on a defined view — and dismiss a false alert without paging the whole shift — is a starting brief.

The brochure cannot see glass at noon, a floodlit yard at 02:00, or a truck that occludes the lane. Demonstration footage is usually cleaner than the live scene. Use it to frame questions. Do not treat it as proof that this site will pass.

Lock four facts before a box is shortlisted:

1. **Task.** What must be visible, and what a person should do when it is.
2. **Place.** Which cameras, heights, and distances on the named UAE or KSA site — not a sister facility.
3. **Path.** Where frames are processed, where alerts land, and who is on shift to act.
4. **Pass rule.** What the real-site test must show, including night, glare, and ordinary empty periods.

A first inquiry needs destination, site and camera count, the intended task, whether existing cameras stay, network and power notes, and a local integration owner. Do not upload personal or sensitive video.

## Checklist: lighting, FOV, network, power, latency budget

Walk the real site with the generic survey in hand. Fill the Gulf columns below in writing. A blank cell is a reason not to pick hardware yet.

| Check | Record on the UAE/KSA site | Fail if |
|---|---|---|
| Lighting | Day, dusk, night, and glare per camera | The brief assumes “good lighting” or copies a lab still |
| FOV | Height, lens, distance, occlusion, existing CCTV | Cameras are “to be confirmed” or treated as interchangeable |
| Network | Path from camera to compute to alert; disconnect and remote support | The quote is silent on outage, or remote access is only verbal |
| Power | Source, PoE or local supply, enclosure, heat, restore after a cut | Outdoor compute has no power and thermal note |
| Latency budget | Agreed time from a real event to a usable alert a named person will act on | The budget is a millisecond figure copied from a model card |

**Lighting.** Gulf outdoor scenes move between harsh sun, reflected glass, and night floodlighting. Record what the camera sees at the hours the task actually runs. If the event is invisible in the live view, a larger box will not invent contrast.

**FOV.** Field of view is geometry before it is a model. Write height, angle, distance, and what routinely blocks the lane. Do not assume every existing CCTV camera can be reused.

**Network.** Name the path: on-camera, on-site box, site LAN, then any service that leaves the building. Write what operators see when the link drops and who may reach the device for support.

**Power.** Outdoor cabinets, PoE, UPS, and generator-backed circuits are site facts. Heat inside an enclosure is part of power. Name who can physically reach the unit after a cut.

**Latency budget.** Write the budget as time from a real event to a usable alert — not inference time inside a model. Include capture, buffering, the network, and the last hop to the reviewer. Agree the threshold with the site owner. This page will not invent a latency number. A vendor millisecond claim is a file, not a pass.

Complete the rest of the generic survey for camera model, weather, mounting, retention, and recovery.

## Privacy and exception review

Name who sees alerts, who may open video, and where inference runs, before any sample is installed. These are operating and procurement questions, not a PDPL interpretation and not legal advice. Escalate answers to counsel and the privacy or security owner.

Write, in an approved system:

1. **Alert audience.** Named roles. Who gets the first ping, who can dismiss it, and who is copied after hours.
2. **Video access.** Who may open live view, clips, and stored files. A share link is access.
3. **Exception review.** What counts as an exception, who reviews it, and in which language — often English, Gulf Arabic, or both.
4. **Inference location.** On the camera, on an on-site box, in a named region, or on a service that leaves the destination you named. “Edge” on a slide is not a location.
5. **Vendor remote access.** Whether a supplier can reach the device, for what purpose, and who authorizes a session.
6. **Retention and deletion.** How long clips and alerts are kept, where they live, and who can delete them.
7. **Training use.** Whether site video or alerts train models, and whether you can opt out in writing.
8. **Exclusions.** Covert capture and views counsel has flagged stay out of scope. Those labels are operating boundaries, not a legal opinion. If a view might be excluded, do not process it in the pilot.

If any line is blank, do not sign acceptance. Verbal answers do not count. Keep sensitive footage out of a first vendor inquiry. See [privacy](/privacy). This page will not say what UAE or KSA law requires. It will not certify a stack against a named privacy statute. Counsel owns that reading. Your job is to produce written facts they can review.

## Acceptance test on the real site

Acceptance is a recorded test on the named site, not a demo in a meeting room. Use footage you are authorized to process. Synthetic clips may help early; they cannot close the gate.

Agree before you start: who confirms an event and on what evidence; a sample window that matches operations, including night and glare where relevant, plus ordinary time with no target event; false alerts and misses counted separately; event-to-alert time against the budget you wrote; failure drills for power loss, network loss, storage full, and recovery; and the exact camera, lens, compute, software, and model settings. A pass is tied to that record.

Pass means the written brief held, the checklist conditions were the conditions you tested, exception review had a named owner, and the agreed thresholds were met or a written exception was accepted by the site owner. Fail means you stop, change the view, change the task, or walk away. Correctable misses can inform a second test. They do not justify a hardware PO from a brochure.

Any threshold is a customer-agreed requirement, not a general promise of performance. See also [Edge AI starts with the site, not the box](/blogs/edge-ai-start-with-the-site).

## When to stop / rescope

Stop or narrow the scope when any of these is true:

- The event is not visible in the live view under the hours you operate, and lighting or FOV cannot be changed on this site.
- Existing cameras cannot see the task, and a new camera path has no owner, power, or mounting.
- No named person reviews alerts or exceptions on the shift that matters.
- Inference location, vendor remote access, or retention is unanswered in writing.
- The latency budget cannot be stated as event-to-alert, only as a model-card millisecond claim.
- You cannot run acceptance on the real UAE or KSA site.
- Two sites or two tasks have been collapsed into one brief to keep the quote simple.
- Counsel or the privacy owner has not been given the exception-review pack.

Rescope is a smaller task, a different camera, a later window, or a decision that this site is not ready. It is not a quieter demo. If the site is not ready, do not pick a box.

## Related reading and next conversation

Use the generic [edge AI site survey](/resources/edge-ai-survey) as the capture sheet. Read [Edge AI starts with the site, not the box](/blogs/edge-ai-start-with-the-site) for the planning argument. Scope the solution path on [Edge AI for a defined camera task](/solutions/edge-vision). This Gulf checklist does not replace those pages.

If you can name the destination, the task, the site conditions, and who reviews exceptions, [explore a partnership](/wholesale), [request a quotation](/request-quote?solution=edge-vision), or [contact CNPS](/contact). Share country, site and camera count, intended task, network and power notes, and the local integration owner. Do not send sensitive video. There is no checkout on this site.
