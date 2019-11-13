/*
 *  Used specification: http://id3.org/id3v2.3.0
 */

/**
 * A decoded ID3 frame
 */
export interface IDecodedFrame {
	/**
	 * The name of the tag
	 */
   tagName: TagName;

	/**
	 * The value of the tag
	 */
	body: Buffer;
}

import { readFileSync, writeFileSync } from "fs";
import {
	specialFrameTags,
	TFrames,
	TFramesV220,
	specialFrameTagsV220,
	TagName,
	ITags,
	TagAlias,
	TextTagAlias,
	SpecialTagName,
	SpecialTagAlias,
	IUserDefinedText,
	TextTagName,
	ISpecialTextTag
} from "./frames";
import iconv from "iconv-lite";

/**
 * The class which handles all ID3 interaction
 */
class NodeID3 {
	/**
	 * Write ID3 tags to a file
	 * @param tags - The metadata tags to write to the file
	 * @param file - The path of the file to write the tags to
	 */
	public write(tags: ITags, file: string): undefined;

	/**
	 * Write ID3 tags to a buffer
	 * @param tags - The metadata tags to write to the buffer
	 * @param buffer - The buffer to write the tags to
	 * @returns The buffer with the tags written
	 */
	public write(tags: ITags, buffer: Buffer): Buffer;
	public write(tags: ITags, fileBuffer: Buffer | string) {
		const completedTags = this.create(tags);

		if (fileBuffer instanceof Buffer){
			return Buffer.concat([
				completedTags,
				this.removeTags(fileBuffer) || fileBuffer
			]);
		}

		const currentData = readFileSync(fileBuffer);

		const newData = Buffer.concat([
			completedTags,
			this.removeTags(currentData) || currentData
		]);

		writeFileSync(fileBuffer, newData, "binary");

		return undefined;
	}

	/**
	 * Create a tags buffer to append to the front of the file or buffer
	 * @param tags - The tags to be in this buffer
	 * @returns The buffer
	 */
	public create(tags: ITags) {
		const frames: Buffer[] = [];

		const header = Buffer.alloc(10, 0);
		header.write("ID3", 0);              //File identifier
		header.writeUInt16BE(0x0300, 3);     //Version 2.3.0  --  03 00
		header.writeUInt16BE(0x0000, 5);     //Flags 00

		// Push a header for the ID3-Frame
		frames.push(header);

		for (const [ tagAlias, tagValue ] of Object.entries(tags)) {
			const tagName = this.convertAliasToTagName(tagAlias as TagAlias);

			if (this.isValidTag(tagName)) {
				frames.push(this.createTextFrame(tagName, tagValue));
			} else if (this.isValidSpecialTag(tagName)) {
				const frame = this.createSpecialFrame(tagName, tagValue);

				if (frame !== undefined) {
					frames.push(frame);
				}
			}
		}

		//The size of the ID3 body less the header size
		const totalSize = frames.reduce((acc, cur) => acc + cur.length, 0) - 10;

		// tslint:disable: no-bitwise
		const size = [
			(totalSize >> 21) & 0x7F,
			(totalSize >> 14) & 0x7F,
			(totalSize >> 7) & 0x7F,
			totalSize & 0x7F
		];

		//  Write bytes to ID3 frame header, which is the first frame
		frames[0].writeUInt8(size[0], 6);
		frames[0].writeUInt8(size[1], 7);
		frames[0].writeUInt8(size[2], 8);
		frames[0].writeUInt8(size[3], 9);

		return Buffer.concat(frames);
	}

	/**
	 * Read ID3 tags from a buffer
	 * @param fileBuffer - The buffer or path to the file to read the tags from
	 * @returns The tags in the buffer
	 */
	public read(fileBuffer: string | Buffer) {
		const bufferToRead = fileBuffer instanceof Buffer ? fileBuffer : readFileSync(fileBuffer);

		const framePosition = this.getFramePosition(bufferToRead);

		if (framePosition === -1) {
			return {};
		}

		const sizeBuffer = Buffer.from(bufferToRead.toString("hex", framePosition, framePosition + 10), "hex");

		const frameSize = this.decodeSize(Buffer.from([ sizeBuffer[6], sizeBuffer[7], sizeBuffer[8], sizeBuffer[9] ]));
		const ID3Frame = Buffer.alloc(frameSize + 1);
		const ID3FrameBody = Buffer.alloc(frameSize - 10 + 1);
		bufferToRead.copy(ID3Frame, 0, framePosition);
		bufferToRead.copy(ID3FrameBody, 0, framePosition + 10);

		//ID3 version e.g. 3 if ID3v2.3.0
		const ID3Version = ID3Frame[3];

		const identifierSize = ID3Version === 2 ? 3 : 4;
		const textframeHeaderSize = ID3Version === 2 ? 6 : 10;

		//  Now, get frame for frame by given size to support unkown tags etc.
		const frames: IDecodedFrame[] = [];
		const tags: ITags = {};

		let currentPosition = 0;
		while (currentPosition < frameSize - 10 && ID3FrameBody[currentPosition] !== 0x00) {
			const bodyFrameHeader = Buffer.alloc(textframeHeaderSize);
			ID3FrameBody.copy(bodyFrameHeader, 0, currentPosition);

			const decodeBuffer = Buffer.from(ID3Version > 2 ? [
				bodyFrameHeader[4],
				bodyFrameHeader[5],
				bodyFrameHeader[6],
				bodyFrameHeader[7]
			] : [
				bodyFrameHeader[3],
				bodyFrameHeader[4],
				bodyFrameHeader[5]
			]);

			const byteLength = ID3Version > 2 ? 4 : 3;

			const bodyFrameSize = ID3Version === 4 ? this.decodeSize(decodeBuffer) : decodeBuffer.readUIntBE(0, byteLength);

			if (bodyFrameSize > (frameSize - currentPosition)) {
				break;
			}

			const bodyFrameBuffer = Buffer.alloc(bodyFrameSize);

			ID3FrameBody.copy(bodyFrameBuffer, 0, currentPosition + textframeHeaderSize);

			//  Size of sub frame + its header
			currentPosition += bodyFrameSize + textframeHeaderSize;

			frames.push({
				tagName: bodyFrameHeader.toString("utf8", 0, identifierSize) as TagName,
				body: bodyFrameBuffer
			});
		}

		for (const { tagName, body } of frames) {
			if(tagName[0] === "T" && tagName !== "TXXX"){
				const decoded = iconv.decode(body.slice(1), body[0] === 0x01 ? "utf16" : "ISO-8859-1").replace(/\0/g, "");

				tags[this.convertTagNameToAlias(tagName, ID3Version) as TextTagAlias] = decoded;
			} else {
				const decoded = this.readSpecialFrames(tagName as SpecialTagName, body, ID3Version);

				if(decoded === undefined){
					continue;
				}

				const alias = this.convertTagNameToAlias(tagName, ID3Version) as SpecialTagAlias;

				if(this.tagHasMultipleEntries(tagName)){
					if(!tags[alias]){
						tags[alias as "userDefinedText"] = [] as IUserDefinedText[];
					}

					(tags[alias] as IUserDefinedText[]).push(decoded as IUserDefinedText);
				} else {
					tags[alias] = decoded as any;
				}
			}
		}

		return tags;
	}

	/**
	 * Remove all the ID3 tags from a file
	 * @param file - The file to remove the ID3 tags from
	 */
	public removeTags(file: string): undefined;

	/**
	 * Remove all the ID3 tags from a buffer
	 * @param buffer - The buffer to remove the tags from
	 * @returns The buffer without ID3 tags
	 */
	public removeTags(buffer: Buffer): Buffer;

	/**
	 * Remove all ID3 tags from a passed buffer
	 * @param data - The buffer to remove the ID3 tags from
	 * @returns The buffer with the ID3 tags removed
	 */
	public removeTags(data: string | Buffer){
		const dataBuffer = typeof data === "string" ? readFileSync(data) : data;

		const ID3Offset = this.getFramePosition(dataBuffer);

		if(ID3Offset === -1) {
			return data;
		}

		const hSize = Buffer.from([
			dataBuffer[ID3Offset + 6],
			dataBuffer[ID3Offset + 7],
			dataBuffer[ID3Offset + 8],
			dataBuffer[ID3Offset + 9]
		]);

		if ((hSize[0] | hSize[1] | hSize[2] | hSize[3]) & 0x80) {
			//  Invalid tag size (msb not 0)
			return false;
		}

		const newData = data.slice(ID3Offset + this.decodeSize(hSize) + 10);

		if(typeof data === "string"){
			writeFileSync(data, newData, "binary");

			return undefined;
		}

		return data.slice(ID3Offset + this.decodeSize(hSize) + 10);
	}

	/**
	 * Update a file with new ID3 tags
	 * @param tags - The tags to update the file with
	 * @param file - The path to the file to update
	 */
	public update(tags: ITags, file: string): undefined;

	/**
	 * Update a buffer with new ID3 tags
	 * @param tags - The tags to update the buffer with
	 * @param buffer - The buffer to update
	 * @returns The buffer with the new tags
	 */
	public update(tags: ITags, buffer: Buffer): Buffer;
	public update(tags: ITags, fileBuffer: string | Buffer){
		const currentTags = this.read(fileBuffer);

		const newTags = {
			...currentTags,
			...tags
		};

		//Typecast fileBuffer to one or the other of string or buffer, it will be handled correctly at runtime
		const result = this.write(newTags, fileBuffer as Buffer);

		return typeof fileBuffer === "string" ? undefined : result;
	}

	/**
	 * Flip an objects key and value
	 * @param obj - The object to flip
	 * @returns The flipped object
	 */
	private flipObject(obj: object){
		return Object.fromEntries(Object.entries(obj).map(([ key, value ]) => [ value, key ]));
	}

	/**
	 * Convert a tag name to it's alias
	 * @param tagName - The tag name to convert
	 * @param version - The frame version
	 * @returns The alias
	 */
	private convertTagNameToAlias(tagName: TagName, version: number): TagAlias{
		const tagNames = version === 2 ? {
			...TFramesV220,
			...specialFrameTagsV220
		} : {
			...TFrames,
			...specialFrameTags
		};

		return this.flipObject(tagNames)[tagName] as TagAlias;
	}

	/**
	 * Test if the passed tag can have multiple entries
	 * @param tagName - The tag to test
	 * @returns Whether or not the tag can have multiple entries
	 */
	private tagHasMultipleEntries(tagName: TagName): tagName is "TXXX" {
		return tagName === "TXXX";
	}

	/**
	 * Get the frames position
	 * @param buffer - The buffer which the frame is in
	 * @returns The position of the frame
	 */
	private getFramePosition(buffer: Buffer){
		const framePosition = buffer.indexOf("ID3");

		return framePosition === -1 || framePosition > 20 ? -1 : framePosition;
	}

	/**
	 * Convert the passed tag alias to it's name
	 * @param alias - The alias to convert
	 * @returns The alias
	 */
	private convertAliasToTagName(alias: TagAlias){
		const aliasNameMap = {
			...TFrames,
			...specialFrameTags
		};

		return aliasNameMap[alias] as TagName;
	}

	/**
	 * Create a standard text frame
	 * @param tagName - The name of the tag
	 * @param tagValue - The value of the tag
	 */
	private createTextFrame(tagName: TextTagName, tagValue: string){
		const encoded = iconv.encode(tagValue, "utf16");

		const buffer = Buffer.alloc(10, 0);
		buffer.write(tagName, 0);
		buffer.writeUInt32BE((encoded).length + 1, 4);

		//POSSIBLE ERROR
		//Return Buffer.concat([ buffer, Buffer.alloc(1).fill(1), Buffer.from(encoded, 'binary') ]);
		return Buffer.concat([ buffer, Buffer.alloc(1, 1), encoded ]);
	}

	/**
	 * Create a special frame using the associated function
	 * @param tagName - The tag name for the frame
	 * @param tagValue - The value for the frame
	 * @returns The special frame
	 */
	// tslint:disable-next-line: no-any
	private createSpecialFrame(tagName: SpecialTagName, tagValue: any){
		switch (tagName) {
			case "COMM":
				return this.createSpecialTextFrame(tagName, tagValue);

			case "APIC":
				return this.createImageFrame(tagValue);

			case "USLT":
				return this.createSpecialTextFrame(tagName, tagValue);

			case "TXXX":
				return this.createUserDefinedTextFrame(tagValue);

			default:
				return undefined;
		}
	}

	/**
	 * Create a special text frame (comment or unsync lyrics)
	 * @param data - The data for this frame
	 * @returns The buffer containing the frame
	 */
	private createSpecialTextFrame(tagName: "COMM" | "USLT", data: ISpecialTextTag){
		const buffer = Buffer.alloc(10, 0);
		buffer.write(tagName, 0);

		const languageCode = data.language === undefined ? "eng" : data.language.substring(0, 3);

		const encodingBuffer = this.createTextEncoding(0x01);
		const languageBuffer = Buffer.from(languageCode);
		const descriptorBuffer = this.createContentDescriptor(data.shortText, 0x01, true);
		const textBuffer = this.createText(data.text, 0x01, false);

		buffer.writeUInt32BE(encodingBuffer.length + languageBuffer.length + descriptorBuffer.length + textBuffer.length, 4);

		return Buffer.concat([ buffer, encodingBuffer, languageBuffer, descriptorBuffer, textBuffer ]);
	}

	/**
	 * Create an image frame
	 * @param data - The data for this image frame, either a buffer or a path to a file
	 * @returns - The buffer containing the frame
	 */
	private createImageFrame(data: Buffer | string){
		const apicData = data instanceof Buffer ? data : Buffer.from(readFileSync(data, "binary"), "binary");
		const bHeader = Buffer.alloc(10, 0);
		bHeader.write("APIC", 0);

		const mimeType = apicData[0] === 0xFF && apicData[1] === 0xD8 && apicData[2] === 0xFF ? "image/jpeg" : "image/png";

		const bContent = Buffer.alloc(mimeType.length + 4, 0);
		bContent[mimeType.length + 2] = 0x03;
		bContent.write(mimeType, 1);

		bHeader.writeUInt32BE(apicData.length + bContent.length, 4);

		return Buffer.concat([ bHeader, bContent, apicData ]);
	}

	/**
	 * Create a user defined text frame
	 * @param data - The data for this user defined text tag
	 * @returns The buffer containing this frame
	 */
	private createUserDefinedTextFrame(data: IUserDefinedText | IUserDefinedText[]){
		const entries = data instanceof Array ? data : [ data ];
		let buffer: Buffer | undefined;

		for (const { description, value } of entries) {
			const headerBuffer = Buffer.alloc(10, 0);
			headerBuffer.write("TXXX", 0);

			const encodingBuffer = this.createTextEncoding(0x01);
			const descriptorBuffer = this.createContentDescriptor(description, 0x01, true);
			const valueBuffer = this.createText(value, 0x01, false);

			headerBuffer.writeUInt32BE(encodingBuffer.length + descriptorBuffer.length + valueBuffer.length, 4);

			const entryBuffer = [ headerBuffer, encodingBuffer, descriptorBuffer, valueBuffer ];

			buffer = Buffer.concat(buffer === undefined ? entryBuffer : [ buffer ].concat(...entryBuffer));
		}

		return buffer;
	}

	/**
	 * Read a special frame using the associated function
	 * @param tagName - The name of the frame to read
	 * @param data - The buffer which this frame is in
	 * @param version - The ID3 version
	 * @returns The frame value
	 */
	private readSpecialFrames(tagName: SpecialTagName, data: Buffer, version: number){
		switch(tagName){
			case "COMM":
				return this.readSpecialTextFrame(data);
			case "PIC":
			case "APIC":
				return this.readImageFrame(data, version);
			case "USLT":
				return this.readSpecialTextFrame(data);
			case "TXXX":
				return this.readUserDefinedTextFrame(data);

			default:
				return undefined;
		}
	}

	/**
	 * Read a comment frame
	 * @param data - The frame to read
	 * @returns The comments data
	 */
	private readSpecialTextFrame(data: Buffer){
		if(data[0] === 0x00) {
			return {
				language: iconv.decode(data, "ISO-8859-1").substring(1, 4).replace(/\0/g, ""),
				shortText: iconv.decode(data, "ISO-8859-1").substring(4, data.indexOf(0x00, 1)).replace(/\0/g, ""),
				text: iconv.decode(data, "ISO-8859-1").substring(data.indexOf(0x00, 1) + 1).replace(/\0/g, "")
			};
		} else if(data[0] === 0x01) {
			let i = 0;

			// tslint:disable-next-line: curly strict-type-predicates
			for(i; data[i] !== undefined && data[i] !== 0x00 || data[i + 1] !== 0x00 || data[i + 2] === 0x00; i++);

			// tslint:disable-next-line: strict-type-predicates
			if(data[i] === undefined) {
				return {};
			}

			return {
				language: data.toString().substring(1, 4).replace(/\0/g, ""),
				shortText: iconv.decode(data.slice(4, i), "utf16").replace(/\0/g, ""),
				text: iconv.decode(data.slice(i + 2), "utf16").replace(/\0/g, "")
			};
		}

		return {};
	}

	/**
	 * Read an image frame
	 * @param data - The buffer to read the frame from
	 * @param version - The ID3 tags version, changes the encoding of the image
	 * @returns The image
	 */
	private readImageFrame(data: Buffer, version: number){
		const descOffset = version === 2 ? 5 : data.indexOf(0x00, 1) + 2;

		const descEnd = data[0] === 0x00 ?
			data.indexOf(0x00, descOffset) :
			descOffset + data.slice(descOffset).indexOf("0000", 0, "hex") + 2;

		return data.slice(descEnd === 0 ? descEnd + 1 : 5);
	}

	/**
	 * Read a user defined text frame
	 * @param data - The buffer to read this frame from
	 * @returns The user defined text tag
	 */
	private readUserDefinedTextFrame(data: Buffer){
		if(data[0] === 0x00) {
			return {
				description: iconv.decode(data, "ISO-8859-1").substring(1, data.indexOf(0x00, 1)).replace(/\0/g, ""),
				value: iconv.decode(data, "ISO-8859-1").substring(data.indexOf(0x00, 1) + 1).replace(/\0/g, "")
			};
		} else if(data[0] === 0x01) {
			let i = 0;

			// tslint:disable-next-line: curly strict-type-predicates
			for(i; data[i] !== undefined && data[i] !== 0x00 || data[i + 1] !== 0x00 || data[i + 2] === 0x00; i++);

			// tslint:disable-next-line: strict-type-predicates
			if(data[i] === undefined) {
				return {};
			}

			return {
				description: iconv.decode(data.slice(1, i), "utf16").replace(/\0/g, ""),
				value: iconv.decode(data.slice(i + 2), "utf16").replace(/\0/g, "")
			};
		}

		return {};
	}

	/**
	 * Decode a size byte of a frame
	 * @param buffer - The size byte to decode
	 * @returns The size of the frame
	 */
	private decodeSize(buffer: Buffer){
		return ((buffer[0] << 21) + (buffer[1] << 14) + (buffer[2] << 7) + (buffer[3]));
	}

	/**
	 * Checks if the passed tag name is valid
	 * @param tagName - The tag name to check for validity
	 * @returns Whether or not the tag is valid
	 */
	private isValidTag(tagName: TagName): tagName is TextTagName{
		return Object.values(TFrames).includes(tagName);
	}

	/**
	 * Checks if the passed special tag name is valid
	 * @param tagName - The special tag name to check for validity
	 * @returns Whether or not the special tag name is valid
	 */
	private isValidSpecialTag(tagName: TagName): tagName is SpecialTagName{
		return Object.values(specialFrameTags).includes(tagName);
	}

	/**
	 * Get the correct encoding byte for the passed tyoe
	 * @param encoding - The type of encoding
	 * @returns The encoding byte
	 */
	private getEncodingByte(encoding: string | number){
		return !encoding || encoding === 0x00 || encoding === "ISO-8859-1" ? 0x00 : 0x01;
	}

	/**
	 * Get the encoding name for the passed encoding type
	 * @param encoding - The type of encoding
	 * @returns The encoding name
	 */
	private getEncodingName(encoding: string | number){
		return this.getEncodingByte(encoding) === 0x00 ? "ISO-8859-1" : "utf16";
	}

	/**
	 * Create a text encoding buffer
	 * @param encoding - The type of encoding
	 * @returns The text encoding buffer
	 */
	private createTextEncoding(encoding: string | number) {
		const buffer = Buffer.alloc(1);
		buffer[0] = this.getEncodingByte(encoding);

		return buffer;
	}

	/**
	 * Create a content descriptor buffer
	 * @param description - The description
	 * @param encoding - The type of encoding
	 * @param terminated - If the buffer is terminated or not
	 */
	private createContentDescriptor(description: string | undefined, encoding: number, terminated: boolean){
		if (!description) {
			return terminated ? iconv.encode("\0", this.getEncodingName(encoding)) : Buffer.alloc(0);
		}

		const desc = iconv.encode(description, this.getEncodingName(encoding));

		return terminated ? Buffer.concat([ desc, Buffer.alloc(this.getTerminationCount(encoding)).fill(0x00) ]) : desc;
	}

	/**
	 * Create a text buffer
	 * @param text - The text
	 * @param encoding - The type of encoding
	 * @param terminated - If the buffer is terminated or not
	 */
	private createText(text: string | undefined, encoding: number, terminated: boolean) {
		const contents = iconv.encode(text || "", this.getEncodingName(encoding));

		return terminated ? Buffer.concat([ contents, Buffer.alloc(this.getTerminationCount(encoding), 0x00) ]) : contents;
	}

	/**
	 * Get the number of termination bytes for the specified type of encoding
	 * @param encoding - The type of encoding
	 * @returns The number of termination bytes
	 */
	private getTerminationCount(encoding: number) {
		return encoding === 0x00 ? 1 : 2;
	}
}

export default new NodeID3();