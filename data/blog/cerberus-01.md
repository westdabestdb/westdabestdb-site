---
title: 'Cerberus TOTP App #1'
date: '2021-10-12'
tags: ['app']
draft: false
summary: I feel like the worst moment for the author is when they have no topic to write about. I had nothing to write about then an idea sparkled in my cerebral cortex. "Create something to write about"... I'm brilliant...
---

I feel like the worst moment for the author is when they have no topic to write about. I had nothing to write about then an idea sparkled in my cerebral cortex. "Create something to write about"... I'm brilliant...

Let me introduce you to my new candidate for the side project graveyard. In this and the following posts, I will do my best to keep this project alive.

<u>_Cerberus_</u> is a Google Authenticator alternative, that is supposed to work on cross platforms and have a beautiful design. My choice of mobile framework will be Flutter, as it supports Android, iOS, macOS, Windows, and Linux, which means it will help me to scale the app to multiple platforms with ease.

## Planning and Design

Authenticator apps are meant to be simple. They are there when you need them, and you should be able to use them easily.
In my imagination, Cerberus needs 2 main pages:

- Page for codes
- Page for settings

In addition to this, it needs a page to scan QR codes.

I came up with a quick wireframe, that has 3 items in the navigation bar, 2 for pages and the middle one for the scanner page.
There are cards to display code information, and we have the title and action button on the top.

![Hopper The Rabbit](/static/images/blog/c1.png) ![test](/static/images/blog/c2.png)

As this is a series of blog posts, I will keep it neat and short. In the next part, I will be focusing on the functional parts of the application, such as biometrics protected storage, saving an OTP secret, and generating the code.

Thanks for reading.
