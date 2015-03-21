# Zapzapzap

Zapzapzap is a simple todo application on Mac OS X.

## Install

check [Download](https://github.com/mainyaa/zapzapzap/release)

### Development

this app using power of [atom-shell](https://github.com/atom/atom-shell)

- `npm install`

To run the app in development:

- `gulp atom-download`
- `gulp build:ng2`
- `gulp` or `gulp --verbose`

building mac app:

- `echo '-' > identity`
- `gulp release` or `gulp release --beta`

if build successful you get `./dist/osx/Zapzapzap-1.0.0.zip` and `./dist/osx/Zapzapzap.app`

## Uninstalling

- Remove Zapzapzap.app
```bash
# remove app data
rm -rf ~/Library/Application\ Support/Zapzapzap
```

## Copyright and License

Code released under the [Apache license](LICENSE).

