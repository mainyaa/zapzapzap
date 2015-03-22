# Zapzapzap

Zapzapzap is a simple todo application on Mac OS X.
It is based on Angular 2 and [atom-shell](https://github.com/atom/atom-shell) and [kitematic](https://github.com/kitematic/kitematic) and [ng2do](https://github.com/davideast/ng2do).

## How it works

Angular 2 is dependencies http server. Zapzapzap is create http server on machine. This server can't be access from other machines.
Detail: 

- Zapzapzap is lauch
- Generate ramdom port(3000-3999)
- Port scan to localhost:[port].
- if port not using, Create http server on localhost:[port].
- access http://localhost:[port]

## Install

check [Download](https://github.com/mainyaa/zapzapzap/release)

### Development

this app using power of [atom-shell](https://github.com/atom/atom-shell)

- `npm install`

To run the app in development:

- `gulp`

building mac app:

- `echo - "-" > identity`
- `gulp release`

if build successful you get `./dist/osx/Zapzapzap-0.0.2.zip` and `./dist/osx/Zapzapzap.app`

## Uninstalling

- Remove Zapzapzap.app
```bash
# remove app data
rm -rf ~/Library/Application\ Support/Zapzapzap
```

## Hack

`deps/es6-shim/es6-shim.js` and `deps/zone.js/zone.js` is patched.

- `gulp patch` or `gulp unpatch`

## Copyright and License

Code released under the [Apache license](LICENSE).

