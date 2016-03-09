# Installation
Requires Foreman + Node

`git clone https://github.com/DoSomething/Node-Presentation.git`
`cd Node-Presentation`
`npm install`

Next create a var.env file, copy the contents from example.var.env and replace the secrets with your own.

Drop (or replace) the slide files in /public and /slides with the updated meeting assets.

`npm start`

# Usage
As a presentation director, visit the control view (/admin). This gives you multiple options for things you can control in the presentation.

### Twitter
The twitter button pulls up the latest tweets for the specified hashtag and opens up a stream with the twitter API to display them in realtime.
Tweets will not show up in the preview box.

### Voice of god
Voice of god is a fun tool that lets you commentate over people.

### Timer
By default, clicking display timer will put 60 seconds on the clock. The input directly above can accept a custom amount of seconds.
Clicking the start timer button will only start the timer for the live presentation, not the preview.

### Slides
Every graphic or mp4 in the /public/slides directory is listed as a slide in this section. You can either
- Click the icon
- Press the hotkey (Blue letter sandwiched between the photo and filename)

These slides are loaded and configured at runtime, any additions or deletions to the /slides folder will require a server restart.

### Presentation states

###### Preview
By default, all buttons you click will only update the Preview screen. All of the admins using the app will be able to see the preview box update.
Previews are good when you want to queue up a slide or test how something looks.

###### Live
Every time you press the GO LIVE button or the enter key, whatever is on the preview screen will go live. The only exception to this rule is Voice of God. If you're currently typing into the voice of god textbox and press enter, the contents of that message will be made live.

The live state of the app is the default index, and should be displayed at a min. of 1920x1080
