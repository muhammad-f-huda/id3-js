/**
 * Flip an objects key and value so that the value becomes the key and vice versa
 * @param obj - The object to flip
 * @returns The flipped object
 */

import { Buffer } from 'buffer';

export const flipObject = <keyType extends string, valueType extends string>(obj: {[key in keyType]: valueType}) => {
	return Object.fromEntries(Object.entries(obj).map(([ key, value ]) => [ value, key ])) as {[key in valueType]: keyType};
};

export const printBuffer = (buffer: Buffer) => {
	console.log(buffer.toString("hex").match(/../g)?.join(" "));
};
