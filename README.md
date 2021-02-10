# Zenti

We aim to make you understand how your browsing habit affects you mentally.

# Installation

The extension is currently being reviewed by the Chrome Web Store team. I'll update the README when it is published in Chrome Web Store.

_That being said_, if you're keen on trying out the latest build:

1. Download the latest build from (https://github.com/lba-studio/zenti/releases/latest/download/zenti.zip)
2. Unzip
3. Load the content you just unzipped as [an unpacked extension](https://developer.chrome.com/docs/extensions/mv2/getstarted/#manifest).

# Getting started

**This extension is currently under closed beta with families and friends. Message me if you want an invite!**

In reality, this requires a few moving parts, but this _should work_ locally without any further modification (since we're temporarily using `lba-studio/sentiment-go` and Auth0 locally).

Since the extension ID (and hence the app's URL) changes for every installation, one would need to be manually added to the Auth0 tenant being used by the app.

```
npm start
```

After everything is compiled, load `/dist` as [an unpacked extension](https://developer.chrome.com/docs/extensions/mv2/getstarted/#manifest).
