import { Schema } from '../index.mjs';

//TODO: support international formats by case (not by loosening)

Schema.define({
    name: 'address.locality',
    regex: /^[\S]+$/g
});

Schema.define({
    name: 'address.streetAddress',
    regex: /^[\S ]+$/g
});

Schema.define({
    name: 'address.region',
    regex: /^[\S]+$/g
});

Schema.define({
    name: 'address.countryName',
    regex: /^[\S]+$/g
});

Schema.define({
    name: 'address.postalCode',
    regex: /^\d{5}$/g
});

Schema.define({
    name: 'address.postOfficeBox',
    regex: /^\d+$/g
});

Schema.define({
    name: 'address.extendedAddress',
    regex: /^[\S]*$/g
});