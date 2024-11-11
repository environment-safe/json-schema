/* global describe:false */
import { chai } from '@environment-safe/chai';
import { it } from '@open-automaton/moka';
import { Path } from '@environment-safe/file';
import { Schema } from '../src/index.mjs';
import '../src/types/address.mjs';
const should = chai.should();

const addressPath = Path.join( '.', 'data', 'address.schema.json' );

describe('@environment-safe/json-schema', ()=>{
    describe('performs a simple test suite', ()=>{
        it('validates address schema', async ()=>{
            const schema = new Schema(addressPath);
            should.exist(schema);
            await schema.loaded;
            const validated = await schema.validate({
                postOfficeBox: '123',
                streetAddress: '456 Main St',
                locality: 'Cityville',
                region: 'State',
                postalCode: '12345',
                countryName: 'Country'
            });
            schema.validationErrors.length.should.equal(0);
            should.exist(validated);
            validated.should.equal(true);
        });
        
        it('fails address schema with incorrect validation', async ()=>{
            const schema = new Schema(addressPath);
            should.exist(schema);
            await schema.loaded;
            const validated = await schema.validate({
                postOfficeBox: '123',
                streetAddress: '456 Main St',
                locality: 'Cityville',
                region: 'State',
                postalCode: 'FFFFF',
                countryName: 'Country'
            });
            schema.validationErrors.length.should.equal(7);
            should.exist(validated);
            validated.should.equal(false);
        });
        
        it('fails address schema with incorrect types', async ()=>{
            const schema = new Schema(addressPath);
            should.exist(schema);
            await schema.loaded;
            const validated = await schema.validate({
                postOfficeBox: 123,
                streetAddress: 16.0,
                locality: 12.45,
                region: 4,
                postalCode: 12345,
                countryName: 23
            });
            schema.validationErrors.length.should.equal(6);
            should.exist(validated);
            validated.should.equal(false);
        });
        
        it('generates an address deterministically', async ()=>{
            const schema = new Schema(addressPath);
            should.exist(schema);
            await schema.loaded;
            const generated = await schema.generate();
            should.exist(generated);
            generated.should.not.deep.equal({});
            should.exist(generated.postOfficeBox);
            should.exist(generated.extendedAddress);
            should.exist(generated.streetAddress);
            should.exist(generated.locality);
            should.exist(generated.region);
            should.exist(generated.postalCode);
            should.exist(generated.countryName);
        });
    });
});

