/*
import { isBrowser, isJsDom } from 'browser-or-node';
import * as mod from 'module';
import * as path from 'path';
let internalRequire = null;
if(typeof require !== 'undefined') internalRequire = require;
const ensureRequire = ()=> (!internalRequire) && (internalRequire = mod.createRequire(import.meta.url));
//*/

/**
 * A JSON object
 * @typedef { object } JSON
 */
 
import { File, Path } from '@environment-safe/file';
import { RandomExpression } from '@environment-safe/regular-expressions';
 
const isValidJsonSchema = (node)=>{
    if(node.type !== 'object') return false;
    if(!(node.properties && typeof node.properties === 'object')) return false;
    return true;
};

const importJSON = async (file)=>{
    const addressSchema = new File(file);
    await addressSchema.load();
    const schemaObject = JSON.parse(addressSchema.body().cast('string'));
    return schemaObject;
};

const fileName = (str)=>{
    const path = new Path(str);
    if(path.parsed.posix){
        return str.split('/').pop().split('.').shift()+'.';
    }else{
        return str.split('\\').pop().split('.').shift()+'.';
    }
};

export class Schema{
    constructor(schema){
        this.prefix = '';
        if( typeof schema === 'string'){
            this.loaded = importJSON(schema);
            this.prefix = fileName(schema);
        }else{
            this.loaded = new Promise((resolve, reject)=>{
                resolve(schema);
            });
        }
        this.loaded = this.loaded.then((schemaObject)=> new Promise((resolve, reject)=>{
            if(!isValidJsonSchema(schemaObject)){
                reject(new Error('Invalid JSON-Schema'));
            }
            resolve(schemaObject);
        }));
        (async ()=>{
            this.schema = await this.loaded;
        })();
    }
    
    async validate(object){
        this.validationErrors = [];
        const keys = Object.keys(this.schema.properties);
        let property;
        let key;
        let fullKey;
        const objectKeys = Object.keys(object);
        let returnValue = true;
        for(let lcv=0; lcv < keys.length; lcv++){
            key = keys[lcv];
            fullKey = this.prefix+key;
            property = this.schema.properties[key];
            if(property.type && objectKeys.indexOf(key) !== -1){
                let failed = false;
                switch(property.type){
                    case 'null' : failed = object[key] !== null; break;
                    case 'boolean' : failed = (typeof object[key] !== 'boolean'); break;
                    case 'object' : failed = (typeof object[key] !== 'object'); break;
                    case 'array' : failed = Array.isArray(object[key]); break;
                    case 'number' : failed = (typeof object[key] !== 'number'); break;
                    case 'string' : failed = (typeof object[key] !== 'string'); break;
                }
                if(failed){
                    this.validationErrors.push( new Error(
                        `field '${
                            key
                        }' of type '${
                            typeof object[key]
                        }' should be of type ${
                            property.type
                        }`
                    ) );
                    returnValue = false;
                }
            }
            if(property.enum && property.enum.indexOf(object[key]) === -1){
                this.validationErrors.push( new Error(
                    `field '${key}' value '${object[key]}' not in enum`
                ) );
                returnValue = false;
            }
            if(property.const && property.const === object[key]){
                this.validationErrors.push( new Error(
                    `field '${key}' value ${object[key]} was expected to be ${property.const}`
                ) );
                returnValue = false;
            }
            //number validation
            if(
                property.multipleOf && 
                property.type == 'number' && 
                ( object[key] %  property.multipleOf !== 0 )
            ){
                this.validationErrors.push( new Error(
                    `field '${key}' was expected to be a multiple of'${property.multipleOf}' not in enum`
                ) );
                returnValue = false;
            }
            if(
                property.minimum && 
                property.type == 'number' && 
                ( object[key] >=  property.minimum )
            ){
                this.validationErrors.push( new Error(
                    `field '${key}' was under the minimum value of ${property.minimum}`
                ) );
                returnValue = false;
            }
            if(
                property.maximum && 
                property.type == 'number' && 
                ( object[key] <=  property.maximum )
            ){
                this.validationErrors.push( new Error(
                    `field '${key}' was above the maximum value of ${property.maximum}`
                ) );
                returnValue = false;
            }
            if(
                property.exclusiveMinimum && 
                property.type == 'number' && 
                ( object[key] >  property.exclusiveMinimum )
            ){
                this.validationErrors.push( new Error(
                    `field '${key}' should be above the exclusive minimum value of ${property.exclusiveMinimum}`
                ) );
                returnValue = false;
            }
            if(
                property.exclusiveMaximum && 
                property.type == 'number' && 
                ( object[key] <  property.exclusiveMaximum )
            ){
                this.validationErrors.push( new Error(
                    `field '${key}' should be below the exclusive maximum value of ${property.exclusiveMaximum}`
                ) );
                returnValue = false;
            }
            //string validation
            if(
                property.maxLength && 
                property.type == 'string' && 
                ( object[key].length <=  property.maxLength )
            ){
                this.validationErrors.push( new Error(
                    `field '${key}' value ${object[key]} was expected to be under ${property.maxLength} characters`
                ) );
                returnValue = false;
            }
            if(
                property.minLength && 
                property.type == 'string' && 
                ( object[key].length >=  property.minLength )
            ){
                this.validationErrors.push( new Error(
                    `field '${key}' value ${object[key]} was expected to be above ${property.minLength} characters`
                ) );
                returnValue = false;
            }
            if(
                property.pattern && 
                property.type == 'string' && 
                !( new RegExp(property.pattern).test(object[key]) )
            ){
                this.validationErrors.push( new Error(
                    `field '${key}' value ${object[key]} was expected to match pattern ${property.pattern}`
                ) );
                returnValue = false;
            }
            //TODO: support nonstandard "validator"
            //TODO: support type-based "validator"
            let validator = Schema.validator(fullKey);
            if(
                validator &&
                !(await validator({}, object, key))
            ){
                this.validationErrors.push( new Error(
                    `field '${key}' value ${object[key]} was expected to match validator ${key}`
                ) );
                returnValue = false;
            }
            //array validation
            if(
                property.maxItems && 
                property.type == 'array' && 
                ( object[key].length <=  property.maxItems )
            ){
                this.validationErrors.push( new Error(
                    `field '${key}' value ${object[key]} was expected to have less than ${property.maxItems} members`
                ) );
                returnValue = false;
            }
            if(
                property.minItems && 
                property.type == 'array' && 
                ( object[key].length >=  property.minItems )
            ){
                this.validationErrors.push( new Error(
                    `field '${key}' value ${object[key]} was expected to more than  ${property.minItems} members`
                ) );
                returnValue = false;
            }
            if(
                property.uniqueItems === true && 
                property.type == 'array'
            ){
                const index = object[key].reduce((agg, item)=>{
                    if(!agg[item]) agg[item] = 1;
                    else agg[item]++;
                }, {});
                const indexKeys = Object.keys(index);
                const maxCount = indexKeys.reduce((agg, key)=>{
                    return agg < index[key]?index[key]:agg;
                }, 0);
                if(maxCount > 1){
                    this.validationErrors.push( new Error(
                        `field '${key}' was expected to contain only unique values`
                    ) );
                    returnValue = false;
                }
            }
            //TODO: minContains, maxContains
            //object validation
            if(
                property.maxProperties && 
                property.type == 'object' && 
                ( Object.keys(object[key]).length >=  property.maxProperties )
            ){
                this.validationErrors.push( new Error(
                    `field '${key}' was not expected to have more than ${property.maxProperties} properties`
                ) );
                returnValue = false;
            }
            if(
                property.minProperties && 
                property.type == 'object' && 
                ( Object.keys(object[key]).length <=  property.minProperties )
            ){
                this.validationErrors.push( new Error(
                    `field '${key}' was not expected to have less than ${property.minProperties} properties`
                ) );
                returnValue = false;
            }
            if(
                property.required && 
                property.type == 'object' && 
                property.required.map((item)=>{
                    return Object.keys(object[key]).indexOf(item) !== -1;
                }).reduce((agg, bool)=>{
                    return agg && bool;
                }, true)
            ){
                this.validationErrors.push( new Error(
                    `field '${key}' was not expected to be present`
                ) );
                returnValue = false;
            }
            //TODO: dependentRequired assertion
            /*
            if(
                property.dependentRequired && 
                property.type == 'object' && 
                property.dependentRequired.map((item)=>{
                    return Object.keys(object[key]).indexOf(item) !== -1;
                }).reduce((agg, bool)=>{
                    return agg && bool;
                }, true)
            ){
                return false;
            }
            //*/
            //TODO: format assertion
            //meta data
        }
        return returnValue;
    }
    
    async generate(){
        this.validationErrors = [];
        const keys = Object.keys(this.schema.properties);
        //let property;
        let key;
        let fullKey;
        let value;
        let returnValue = {};
        for(let lcv=0; lcv < keys.length; lcv++){
            key = keys[lcv];
            fullKey = this.prefix+key;
            //property = this.schema.properties[key];
            let generator = Schema.generator(fullKey);
            if(generator){
                value = await generator({}, returnValue, key);
                returnValue[key] = value;
            }
        }
        return returnValue;
    }
}

let schemaValidators = {};
let schemaGenerators = {};
let contexts = {};

//give a descention, get back a node and the fieldname
const schemaContext = (context, handler, node)=>{
    //TODO: loop unroll
    const thisNode = node || contexts;
    if(typeof context === 'string'){
        return schemaContext(context.split('.'), handler, thisNode);
    }
    if(context.length === 1){
        return handler(context[0], thisNode);
    }
    const thisContext = context.shift();
    const nextNode = (thisNode[thisContext] || (thisNode[thisContext] = {}));
    return schemaContext(context, handler, nextNode);
};

Schema.define = (options)=>{
    if(options.name && options.validate){
        Schema.validator(options.name, options.validate);
    }
    if(options.name && options.generate){
        Schema.generator(options.name, options.generate);
    }
    if(options.name && options.regex){
        
        const generator = new RandomExpression(options.regex);
        const validator = new RegExp(options.regex);
        if(!options.generate){
            Schema.generator(options.name, async (context, object)=>{
                return generator.generate();
            });
        }
        if(!options.validate){
            Schema.validator(options.name, async (context, object, field)=>{
                const value = object[field];
                const result = validator.test(value);
                return result;
            });
        }
    }
    //TODO: local LLM access through ollama API
};

Schema.validator = (name, validator)=>{
    let result = null;
    schemaContext(name, (field, parent)=>{
        if(!parent[field]) parent[field] = {};
        if(validator) parent[field].validator =  name;
        result = name;
    });
    if(validator) schemaValidators[name] = validator;
    return result && schemaValidators[result];
};

Schema.generator = (name, generator)=>{
    let result = null;
    schemaContext(name, (field, parent)=>{
        if(!parent[field]) parent[field] = {};
        if(generator) parent[field].generator =  name;
        result = name;
    });
    if(generator) schemaGenerators[name] = generator;
    return result && schemaGenerators[result];
};