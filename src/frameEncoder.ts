import iconv from "iconv-lite";
import FrameDefinitions, {
	IFrames,
	AllFrameAliases,
	FrameName,
	SpecialFrameName,
	ISpecialTextFrame,
	IUserDefinedTextFrame
} from "./frameDefinitions";

/**
 * Handles the encoding of frames
 */
export default class FrameEncoder {
	/**
	 * Encode frames
	 * @param frames - The frames to encode
	 * @returns An array of buffers which contain the encoded frames
	 */
	public static encodeFrames(frames: IFrames){
		const frameBuffers: Buffer[] = [];

		// tslint:disable-next-line: no-any
		for(const [ frameAlias, frameValue ] of Object.entries(frames) as Array<[AllFrameAliases, any]>){
			const frameName = FrameDefinitions.convertAliasToName(frameAlias);

			if (FrameDefinitions.isTextFrame(frameName)) {
				frameBuffers.push(this.createTextFrame(frameName as FrameName, frameValue));
			} else {
				const frame = this.createSpecialFrame(frameName as SpecialFrameName, frameValue);

				if (frame !== undefined) {
					frameBuffers.push(frame);
				}
			}
		}

		return frameBuffers;
	}

	/**
	 * Create a standard text frame
	 * @param frameName - The name of the frame
	 * @param frameValue - The value of the frame
	 * @returns The newly created text frame buffer
	 */
	private static createTextFrame(frameName: FrameName, frameValue: string){
		const encoded = iconv.encode(frameValue, "utf16");

		const buffer = Buffer.alloc(10, 0);
		buffer.write(frameName, 0);
		buffer.writeUInt32BE((encoded).length + 1, 4);

		return Buffer.concat([ buffer, Buffer.alloc(1, 1), encoded ]);
	}

	/**
	 * Create a special frame using the associated function
	 * @param frameName - The name of the frame
	 * @param frameValue - The value for the frame
	 * @returns The special frame
	 */
	// tslint:disable-next-line: no-any
	private static createSpecialFrame(frameName: SpecialFrameName, frameValue: any){
		switch (frameName) {
			case "COMM":
				return this.createSpecialTextFrame(frameName, frameValue);

			case "APIC":
				return this.createImageFrame(frameValue);

			case "USLT":
				return this.createSpecialTextFrame(frameName, frameValue);

			case "TXXX":
				return this.createUserDefinedTextFrame(frameValue);

			default:
				return undefined;
		}
	}

	/**
	 * Create a special text frame (comment or unsync lyrics)
	 * @param data - The data for this frame
	 * @returns The buffer containing the frame
	 */
	private static createSpecialTextFrame(frameName: "COMM" | "USLT" | "TXXX", data: ISpecialTextFrame){
		const buffers: Buffer[] = [];

		const encodingBuffer = Buffer.alloc(1);
		encodingBuffer[0] = 0x01;

		buffers.push(encodingBuffer);

		if(frameName !== "TXXX"){
			buffers.push(Buffer.from(data.language === undefined ? "eng" : data.language.substring(0, 3)));
		}

		const contentDescriptorBuffer = !data.shortText ?
			iconv.encode("\0", "utf16") :
			Buffer.concat([ iconv.encode(data.shortText, "utf16"), Buffer.alloc(2).fill(0x00) ]);

		buffers.push(contentDescriptorBuffer);

		buffers.push(iconv.encode(data.text || "", "utf16"));

		const headerBuffer = Buffer.alloc(10, 0);
		headerBuffer.write(frameName, 0);
		headerBuffer.writeUInt32BE(buffers.reduce((acc, cur) => acc + cur.length, 0), 4);

		return Buffer.concat([ headerBuffer, ...buffers ]);
	}

	/**
	 * Create a user defined text frame
	 * @param data - The data for this user defined text frame
	 * @returns The buffer containing this frame
	 */
	private static createUserDefinedTextFrame(data: IUserDefinedTextFrame | IUserDefinedTextFrame[]){
		const entries = data instanceof Array ? data : [ data ];
		let buffer: Buffer | undefined;

		for (const { description, value } of entries) {
			const singleBuffer = this.createSpecialTextFrame("TXXX", {
				language: undefined,
				shortText: description,
				text: value
			});

			buffer = buffer === undefined ? singleBuffer : Buffer.concat([ buffer, singleBuffer ]);
		}

		return buffer;
	}

	/**
	 * Create an image frame
	 * @param data - The data for this image frame, either a buffer or a path to a file
	 * @returns - The buffer containing the frame
	 */
	private static createImageFrame(apicData: Buffer){
		const bHeader = Buffer.alloc(10, 0);
		bHeader.write("APIC", 0);

		const mimeType = apicData[0] === 0xFF && apicData[1] === 0xD8 && apicData[2] === 0xFF ? "image/jpeg" : "image/png";

		const bContent = Buffer.alloc(mimeType.length + 4, 0);
		bContent[mimeType.length + 2] = 0x03;
		bContent.write(mimeType, 1);

		bHeader.writeUInt32BE(apicData.length + bContent.length, 4);

		return Buffer.concat([ bHeader, bContent, apicData ]);
	}
}
