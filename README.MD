# Gmail Utils
A chrome extension developed for Gmail that is being used to check if recipients have opened sent emails.

## Technique
 When enabled, the chrome extension will inject ``<img src=".../<mid>" alt=""/>`` to the end of your email. The image can not be loaded so it cannot be seen by your recipients.


When one opens your email, Gmail will try to render the image so a request to our webserver will be made demanding the image given by the ``src`` attribute.
However, ``src`` contains the ``mid`` (Mail Identifier) of your email. So if a request is made to that route, we know who opened your email and when.