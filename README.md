# eSteem Desktop

eSteem is stand-alone application that works on cross platforms. You can specify websocket to connect and start using without worrying to send your credentials to any server. Or being censored, disconnected.

You can also run Steem blockchain locally and connect through websocket specified in your configuration.

eSteem keeps your private keys locally and only uses it to sign transaction and ONLY transaction hash is broadcasted to specified websocket. Your keys never leave app, make sure to keep your PC secure.

Check out eSteem mobile versions as well, available on iOS and Android devices [eSteem mobile](http://esteem.ws).

## Only download and install versions provided on this [official github](https://github.com/feruzm/releases)

### For more info:

http://www.esteem.ws

info@esteem.ws

https://steemit.com/@good-karma


## Requirements

Electron is expected to be installed globally:

```bash
npm install -g electron-prebuilt
```

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
$ git clone https://github.com/feruzm/esteem-desktop
# Go into the repository
$ cd esteem-desktop
# Install dependencies and run the app
$ bower install
# Make sure to run `npm install` in node_modules/steem-rpc and node_modules/steemjs-lib if you get error
$ npm install && npm start
```

Learn more about Electron and its API in the [documentation](http://electron.atom.io/docs/latest).

## To build

You will need grunt (`npm install grunt-cli`) to utilize automated scripts,
from there you can use `grunt build` to package your Electron app using Electron Packager
which will:

- Clean any previous build
- Prepare a minimal App in the `/build` folder (configurable in Gruntfile.js)
- Find node_modules dependencies in your `index.html` and add them accordingly to the `build` folder
- Install dependencies
- Package the App using `ASAR` (configurable)
- Create distribution package for all platforms (configurable) in the `dist` folder

#### License [MIT](LICENSE.md)
