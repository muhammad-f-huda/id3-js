/**
 * Flip an objects key and value so that the value becomes the key and vice versa
 * @param obj - The object to flip
 * @returns The flipped object
 */
export const flipObject = <keyType extends string, valueType extends string>(obj: {[key in keyType]: valueType}) => {
	return Object.fromEntries(Object.entries(obj).map(([ key, value ]) => [ value, key ])) as {[key in valueType]: keyType};
};