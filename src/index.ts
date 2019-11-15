/*
 * Used specification: http://id3.org/id3v2.3.0
 */

/**
 * A decoded ID3 frame
 */
export interface IDecodedFrame {
	/**
	 * The name of the frame
	 */
   frameName: AllFrameNames;

	/**
	 * The value of the frame
	 */
	body: Buffer;
}

import { readFileSync, writeFileSync } from "fs";
import FrameDecoder from "./frameDecoder";
import { IFrames, AllFrameNames } from "./frameDefinitions";
import FrameEncoder from "./frameEncoder";

/**
 * The class which handles all ID3 interaction
 */
class NodeID3 {
	/**
	 * Write ID3 frames to a file
	 * @param frames - The metadata frames to write to the file
	 * @param file - The path of the file to write the frames to
	 */
	public write(file: string, frames: IFrames): undefined;

	/**
	 * Write ID3 frames to a buffer
	 * @param frames - The metadata frames to write to the buffer
	 * @param buffer - The buffer to write the frames to
	 * @returns The buffer with the frames written
	 */
	public write(buffer: Buffer, frames: IFrames): Buffer;
	public write(fileBuffer: Buffer | string, frames: IFrames) {
		const currentData = fileBuffer instanceof Buffer ? fileBuffer : readFileSync(fileBuffer);

		const newData = Buffer.concat([
			this.create(frames),
			this.remove(currentData)
		]);

		if(typeof fileBuffer === "string"){
			writeFileSync(fileBuffer, newData, "binary");

			return undefined;
		}

		return newData;
	}

	/**
	 * Create a frames buffer to append to the front of the file or buffer
	 * @param frames - The frames to be in this buffer
	 * @returns The buffer
	 */
	public create(frames: IFrames) {
		const frameBuffers: Buffer[] = [];

		const header = Buffer.alloc(10, 0);
		header.write("ID3", 0);              //File identifier
		header.writeUInt16BE(0x0300, 3);     //Version 2.3.0  --  03 00
		header.writeUInt16BE(0x0000, 5);     //Flags 00

		// Push a header for the ID3-Frame
		frameBuffers.push(header, ...FrameEncoder.encodeFrames(frames));

		//The size of the ID3 body less the header size
		const totalSize = frameBuffers.reduce((acc, cur) => acc + cur.length, 0) - 10;

		// tslint:disable: no-bitwise
		const size = [
			(totalSize >> 21) & 0x7F,
			(totalSize >> 14) & 0x7F,
			(totalSize >> 7) & 0x7F,
			totalSize & 0x7F
		];

		//  Write bytes to ID3 frame header, which is the first frame
		frameBuffers[0].writeUInt8(size[0], 6);
		frameBuffers[0].writeUInt8(size[1], 7);
		frameBuffers[0].writeUInt8(size[2], 8);
		frameBuffers[0].writeUInt8(size[3], 9);

		return Buffer.concat(frameBuffers);
	}

	/**
	 * Read ID3 information from a file
	 * @param file - The path to the file for which to read the ID3 information
	 * @returns The ID3 information
	 */
	public read(file: string): IFrames;

	/**
	 * Read ID3 information from a buffer
	 * @param fileBuffer - The buffer to read the information from
	 * @returns The ID3 information
	 */
	public read(buffer: Buffer): IFrames;
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

		const frames: IDecodedFrame[] = [];

		let currentPosition = 0;
		while (currentPosition < frameSize - 10 && ID3FrameBody[currentPosition] !== 0x00) {
			const bodyFrameHeader = Buffer.alloc(textframeHeaderSize);
			ID3FrameBody.copy(bodyFrameHeader, 0, currentPosition);

			const frameSizeBuffer = Buffer.from(ID3Version > 2 ? [
				bodyFrameHeader[4],
				bodyFrameHeader[5],
				bodyFrameHeader[6],
				bodyFrameHeader[7]
			] : [
				bodyFrameHeader[3],
				bodyFrameHeader[4],
				bodyFrameHeader[5]
			]);

			const bodyFrameSize = ID3Version === 4 ?
				this.decodeSize(frameSizeBuffer) :
				frameSizeBuffer.readUIntBE(0, ID3Version > 2 ? 4 : 3);

			if (bodyFrameSize > (frameSize - currentPosition)) {
				break;
			}

			const bodyFrameBuffer = Buffer.alloc(bodyFrameSize);

			ID3FrameBody.copy(bodyFrameBuffer, 0, currentPosition + textframeHeaderSize);

			//  Size of sub frame + its header
			currentPosition += bodyFrameSize + textframeHeaderSize;

			frames.push({
				frameName: bodyFrameHeader.toString("utf8", 0, identifierSize) as AllFrameNames,
				body: bodyFrameBuffer
			});
		}

		return FrameDecoder.decodeFrames(frames, ID3Version);
	}

	/**
	 * Remove the ID3 tag from a file
	 * @param file - The file to remove the ID3 tag from
	 */
	public remove(file: string): undefined;

	/**
	 * Remove all the ID3 tag from a buffer
	 * @param buffer - The buffer to remove the tag from
	 * @returns The buffer without the ID3 tag
	 */
	public remove(buffer: Buffer): Buffer;
	public remove(data: string | Buffer){
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
			//  Invalid tag size
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
	 * Update a file with new ID3 frames
	 * @param frames - The frames to update the file with
	 * @param file - The path to the file to update
	 */
	public update(frames: IFrames, file: string): undefined;

	/**
	 * Update a buffer with new ID3 frames
	 * @param frames - The frames to update the buffer with
	 * @param buffer - The buffer to update
	 * @returns The buffer with the new frames
	 */
	public update(frames: IFrames, buffer: Buffer): Buffer;
	public update(frames: IFrames, fileBuffer: string | Buffer){
		//Typecast fileBuffer to one or the other of string or buffer, it will be handled correctly at runtime
		const result = this.write(fileBuffer as Buffer, {
			...this.read(fileBuffer as Buffer),
			...frames
		});

		return typeof fileBuffer === "string" ? undefined : result;
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
	 * Decode a size byte of a frame
	 * @param buffer - The size byte to decode
	 * @returns The size of the frame
	 */
	private decodeSize(buffer: Buffer){
		return ((buffer[0] << 21) + (buffer[1] << 14) + (buffer[2] << 7) + (buffer[3]));
	}
}

export default new NodeID3();