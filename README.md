# foundation-email-process-output
use foundation inky v2 email template builder programmatically. 
Provide data and receive a string back.

![alt tag](https://cloud.githubusercontent.com/assets/14369198/23330631/cc6521da-fb52-11e6-8dd3-e27d62791e76.png)

## install
```console
npm install inky-email-render-to-string
```

## usage
instanciate the class with the path to **email templates folder**. Then you can use the **produceMail** method with parameters to output a promise with the email as a string.
You can render several email templates as long as they share the same default layout.
```javascript
const InkyMailOutput = require('inky-email-render-to-string');

// create instance with relative root path to template assets folder
let instance = new InkyMailOutput('email-template');

// provide mail (template, conf, data) --> return processed email as promise
let templateName = 'basic';

// respective folders (see Inky/Panini Docs) + mail subject
let emailConfig = {
    root: 'pages',
    layouts: 'layouts',
    partials: 'partials',
    helpers: 'helpers',
    css: 'css/app.css',
    subject: 'My Basic Email Template Subject'
};

// all data to populate the email template
let emailData = {
    title: 'Hi, Susan Calvin',
    content: {
        lead: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Magni, iste, amet consequatur a veniam.',
        body: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ut optio nulla et, fugiat. Maiores accusantium nostrum asperiores provident, quam modi ex inventore dolores id aspernatur architecto odio minima perferendis, explicabo. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Minima quos quasi itaque beatae natus fugit provident delectus, magnam laudantium odio corrupti sit quam. Optio aut ut repudiandae velit distinctio asperiores?',
        callout: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Reprehenderit repellendus natus, sint ea optio dignissimos asperiores inventore a molestiae dolorum placeat repellat excepturi mollitia ducimus unde doloremque ad, alias eos!'
    }
};

// render email and rceive promise based email string
instance.produceMail(templateName, emailConfig, emailData).then(
    function(resp) { 
        console.log('successful email render', resp); 
    },
    function(error) { console.log(error); }
);
```

Note: the **email-template** folder is provided as a sample based on Foundation email template. You can delete it and provide your own. Remember to modify the config accordingly.

### Changelog
v0.0.2
- no need to pass data folder property in emailConfig. It is setup automatically.
- fixed root path calculation when used as dependency package