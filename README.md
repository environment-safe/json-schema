@environment-safe/json-schema
=============================
[JSON Schema](https://json-schema.org/specification) validator and generator with integrated data synthesis.

Usage
-----

```js
import { Schema } from '@environment-safe/json-schema';

Schema.generateType('address.streetAddress');
const schema = new Schema('./file.js'); //or new Schema(jsonObject);
await schema.loaded;

const isValid = schema.validate(jsonObject);
const sampleObject = schema.generate(incomingData);
```

Testing
-------

Run the es module tests to test the root modules
```bash
npm run import-test
```
to run the same test inside the browser:

```bash
npm run browser-test
```
to run the same test headless in chrome:
```bash
npm run headless-browser-test
```

to run the same test inside docker:
```bash
npm run container-test
```

Run the commonjs tests against the `/dist` commonjs source (generated with the `build-commonjs` target).
```bash
npm run require-test
```

Development
-----------
All work is done in the .mjs files and will be transpiled on commit to commonjs and tested.

If the above tests pass, then attempt a commit which will generate .d.ts files alongside the `src` files and commonjs classes in `dist`

