# ID3-JS
A library for reading and writing ID3 data.

## How to use
---

First install the package
```
npm install --save @calme1709/id3-js
```

And then include the package in your code
```javascript
import ID3JS from "@calme1709/id3-js";
```
or
```javascript
const ID3JS = require("@calme1709/id3-js");
```

You can then proceed to use the library in your project

##### Writing ID3 data
***
Writing ID3 data replaces all the existing data with the data that is passed to the method. If you only want to replace the defined data and leave the rest as it is, use the update method.
###### Write to a file
```javascript
import ID3JS from "@calme1709/id3-js";

ID3JS.write("./song.mp3", {
    title: "Song",
    artist: "Artist"
});
```
###### Write to a buffer
```javascript
import fs from "fs";
import ID3JS from "@calme1709/id3-js";

let buffer = fs.readFileSync("./song.mp3");

buffer = ID3JS.write(buffer, {
    title: "Song",
    artist: "Artist"
});
```

##### Reading ID3 data
***
###### Read from a file
```javascript
import ID3JS from "@calme1709/id3-js";

ID3JS.read("./song.mp3");
```
###### Read from a buffer
```javascript
import fs from "fs";
import ID3JS from "@calme1709/id3-js";

const buffer = fs.readFileSync("./song.mp3");

ID3JS.read(buffer);
```

##### Updating ID3 data
***
Updating ID3 data only affects those properties which are defined in the new information, the existing data that will not be overwritten is left unaffected.
###### Update a file
```javascript
import ID3JS from "@calme1709/id3-js";

ID3JS.update("./song.mp3", {
    title: "Song",
    artist: "Artist"
});
```
###### Update a buffer
```javascript
import fs from "fs";
import ID3JS from "@calme1709/id3-js";

let buffer = fs.readFileSync("./song.mp3");

buffer = ID3JS.update(buffer, {
    title: "Song",
    artist: "Artist"
});
```

##### Removing ID3 data
***
###### Remove data from a file
```javascript
import ID3JS from "@calme1709/id3-js";

ID3JS.remove("./song.mp3");
```
###### Remove data from a buffer
```javascript
import fs from "fs";
import ID3JS from "@calme1709/id3-js";

let buffer = fs.readFileSync("./song.mp3");

buffer = ID3JS.remove(buffer);
```

## Methods
---
### write()
Writes the specified information to either the file at the passed path, or the passed buffer. Overwrites all information currently in the file, if you want to leave non defined information unaffected use the update method.
##### Overloads
|Call|Description|Return|
|---|---|---|
| write(string, IFrames) | Writes the information passed to the file at the passed path, overwriting any existing data. Returns nothing. | undefined |
| write(buffer, IFrames) | Writes the information passed to the passed buffer and returns it. | Buffer |

### read()
Reads the ID3 information from the file at the passed path, or from the passed buffer.
##### Overloads
|Call|Description|Return|
|---|---|---|
| read(string) | Reads the data from the file at the passed path and returns it. | IFrames |
| read(buffer) | Reads the data from the passed buffer and returns it. | IFrames |

### update()
Writes the specified information to either the file at the passed path, or the passed buffer. Leaves all information that is not defined untouched.
##### Overloads
|Call|Description|Return|
|---|---|---|
| update(string, IFrames) | Writes the information passed to the file at the passed path. Returns nothing. | undefined |
| update(buffer, IFrames) | Writes the information passed to the passed buffer and returns it. | Buffer |

### remove()
Removes all ID3 data from either the file at the passed path, or the passed buffer.
##### Overloads
|Call|Description|Return|
|---|---|---|
| remove(string) | Removes all ID3 data from the file at the passed path. | undefined |
| remove(buffer) | Removes all ID3 data from the passed buffer and returns it. | Buffer |

## Supported properties
---
Information in ID3 can be either of two types; either a standard text frame, or a special frame. Below is all of the properties that can be set, to make the usage of this library easier, all properties have been mapped to aliases, however the raw names will be supported in a future update.
#### Text Properties
- album
- bpm
- composer
- genre
- copyright
- date
- playlistDelay
- encodedBy
- textWriter
- fileType
- time
- contentGroup
- title
- subtitle
- initialKey
- language
- length
- mediaType
- originalTitle
- originalFilename
- originalTextwriter
- originalArtist
- originalYear
- fileOwner
- artist
- performerInfo
- conductor
- remixArtist
- partOfSet
- publisher
- trackNumber
- recordingDates
- internetRadioName
- internetRadioOwner
- size
- ISRC
- encodingTechnology
- year

#### Special Properties
There are four special properties supported, these are below with their types.
- comment: {
&nbsp;&nbsp;&nbsp;&nbsp;text: string;
&nbsp;&nbsp;&nbsp;&nbsp;language: string;
&nbsp;&nbsp;&nbsp;&nbsp;shortText: string;
}

- image: Buffer
- unsynchronisedLyrics: {
&nbsp;&nbsp;&nbsp;&nbsp;text: string;
&nbsp;&nbsp;&nbsp;&nbsp;language: string;
&nbsp;&nbsp;&nbsp;&nbsp;shortText: string;
}
- userDefinedText {
&nbsp;&nbsp;&nbsp;&nbsp;description: string;
&nbsp;&nbsp;&nbsp;&nbsp;value: string;
}
