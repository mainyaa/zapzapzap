# Zapzapzap

Zapzapzap is a simple todo application on Mac OS X.

## How it works

Angular 2 is dependencies http server. Zapzapzap is create http server on machine. This server can't be access from other machines.

## Install

check [Download](https://github.com/mainyaa/zapzapzap/release)

### Development

this app using power of [atom-shell](https://github.com/atom/atom-shell)

- `npm install`

To run the app in development:

- `gulp clean init`
- `gulp`

building mac app:

- `echo - "-" > identity`
- `gulp release` or `gulp release --beta`

if build successful you get `./dist/osx/Zapzapzap-0.0.2.zip` and `./dist/osx/Zapzapzap.app`

## Uninstalling

- Remove Zapzapzap.app
```bash
# remove app data
rm -rf ~/Library/Application\ Support/Zapzapzap
```

## hack

`deps/es6-shim/es6-shim.js` and `deps/zone.js/zone.js` is patched

## Copyright and License

Code released under the [Apache license](LICENSE).

