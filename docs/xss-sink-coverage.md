# XSS Sink Coverage

An audit was performed across `src/app/**` to identify common cross-site scripting (XSS) sinks.
The following patterns were searched using ripgrep and returned no results:

- `dangerouslySetInnerHTML`
- `innerHTML`
- `document.write`
- `eval(`

No direct XSS sinks were detected in the application components under `src/app/`.
This document should be updated if new code introduces any of the patterns above or other dynamic script execution sinks.
