import { IDecodedFrame } from ".";
import { Buffer } from 'buffer';
import iconv from "iconv-lite";
import Frames, {
	IFrames,
	SpecialFrameName,
	V2SpecialFrameName,
	FrameAlias,
	SpecialFrameAlias,
	IUserDefinedTextFrame
} from "./frameDefinitions";
import { printBuffer } from "./utils";

/**
 * A class which handles all of the decoding of
 */
export default class FrameDecoder {
	/**
	 * Decode an array of frames
	 * @param frames - The frames to decode
	 * @param version - The ID3 version to use for decoding
	 * @returns The decoded frames
	 */
	public static decodeFrames(frames: IDecodedFrame[], version: number){
		const decodedFrames: IFrames = {};

		for (const { frameName, body } of frames) {
			if(frameName[0] === "T" && frameName !== "TXXX"){
				const decoded = iconv.decode(body.slice(1), body[0] === 0x01 ? "utf16" : "ISO-8859-1").replace(/\0/g, "");

				const alias = Frames.convertNameToAlias(frameName) as FrameAlias;

				decodedFrames[alias] = decoded;
			} else {
				const decoded = this.readSpecialFrame(frameName as SpecialFrameName | V2SpecialFrameName, body, version);

				if(decoded === undefined){
					continue;
				}

				const alias = Frames.convertNameToAlias(frameName) as SpecialFrameAlias;

				if(Frames.canHaveMultipleEntries(frameName)){
					if(!decodedFrames[alias]){
						decodedFrames[alias as "userDefinedText"] = [] as IUserDefinedTextFrame[];
					}

					(decodedFrames[alias] as IUserDefinedTextFrame[]).push(decoded as IUserDefinedTextFrame);
				} else {
					// tslint:disable-next-line: no-any
					decodedFrames[alias] = decoded as any;
				}
			}
		}

		return decodedFrames;
	}

	/**
	 * Read a special frame using the associated function
	 * @param frameName - The name of the frame to read
	 * @param data - The buffer which this frame is in
	 * @param version - The ID3 version
	 * @returns The frame value
	 */
	private static readSpecialFrame(frameName: SpecialFrameName | V2SpecialFrameName, data: Buffer, version: number){
		switch(frameName){
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
	private static readSpecialTextFrame(data: Buffer){
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
	 * @param version - The ID3 tag version, changes the encoding of the image
	 * @returns The image
	 */
	private static readImageFrame(data: Buffer, version: number){
		const descOffset = version === 2 ? 5 : data.indexOf(0x00, 1) + 2;

		const descEnd = data[0] === 0x00 ?
			data.indexOf(0x00, descOffset) :
			descOffset + data.slice(descOffset).indexOf("0000", 0, "hex") + 2;

		return data.slice(descEnd === 0 ? descEnd + 1 : 5);
	}

	/**
	 * Read a user defined text frame
	 * @param data - The buffer to read this frame from
	 * @returns The user defined text frame
	 */
	private static readUserDefinedTextFrame(data: Buffer){
		printBuffer(data);

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

		return undefined;
	}
}
