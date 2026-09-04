# A voice device prototype specification

For product teams exploring a limited voice interaction. Define one useful job, such as answering approved exhibit questions or retrieving a small set of public instructions.

## Describe the intended use

Identify the user, task, language, location, expected daily interactions and acoustic conditions. State what the assistant should refuse and when it should hand over to a person. Avoid defining the prototype as an unlimited general-purpose assistant.

## Specify the whole stack

| Layer | Questions |
|---|---|
| Hardware | Which board, microphones, speaker, power supply and enclosure? |
| Network | Wi-Fi or another connection? What happens offline? |
| Voice | Which speech recognition and synthesis services? Which languages? |
| Model | Which version, hosting region and usage terms? |
| Content | Who supplies, approves and updates the answers? |
| Operations | Who maintains firmware, credentials and backend services? |

Open firmware such as [XiaoZhi ESP32](https://github.com/78/xiaozhi-esp32) can provide a starting point. Its license does not automatically cover all connected services, voices, designs or brands.

## Test the interaction

Record task completion, interruptions, latency, misunderstanding, background noise and recovery after disconnection. Keep the hardware and backend configuration with the result. A successful quiet-room demo is not a production reliability test.

## Plan costs and lifecycle

Separate prototype engineering from device manufacturing. Include speech and model usage, content maintenance, hosting, firmware updates, returns and replacements. Specify what happens if a backend provider changes terms or discontinues service.

Before a production order, confirm applicable testing, product rights, tooling, minimum order, quality control and support responsibilities. Requirements for children, healthcare or other sensitive contexts need additional assessment.

[Discuss a voice prototype](/request-quote?solution=voice-prototypes)
