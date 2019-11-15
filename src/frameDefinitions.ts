import { flipObject } from "./utils";

export type V2FrameName = "TAL" | "TBP" | "TCM" | "TCO" | "TCR" | "TDA" | "TDY" | "TEN" | "TXT" | "TFT" | "TIM" | "TT1" | "TT2" | "TT3" | "TKE" | "TLA" | "TLE" | "TMT" | "TOT" | "TOF" | "TOL" | "TOA" | "TOR" | "TP1" | "TP2" | "TP3" | "TP4" | "TPA" | "TPB" | "TRK" | "TRD" | "TSI" | "TRC" | "TSS" | "TYE";
export type V2FrameAlias = "album" | "bpm" | "composer" | "genre" | "copyright" | "date" | "playlistDelay" | "encodedBy" | "textWriter" | "fileType" | "time" | "contentGroup" | "title" | "subtitle" | "initialKey" | "language" | "length" | "mediaType" | "originalTitle" | "originalFilename" | "originalTextwriter" | "originalArtist" | "originalYear" | "artist" | "performerInfo" | "conductor" | "remixArtist" | "partOfSet" | "publisher" | "trackNumber" | "recordingDates" | "size" | "ISRC" | "encodingTechnology" | "year";

export type V2SpecialFrameName = "PIC";
export type V2SpecialFrameAlias = "image"

export type FrameAlias = "album" | "bpm" | "composer" | "genre" | "copyright" | "date" | "playlistDelay" | "encodedBy" | "textWriter" | "fileType" | "time" | "contentGroup" | "title" | "subtitle" | "initialKey" | "language" | "length" | "mediaType" | "originalTitle" | "originalFilename" | "originalTextwriter" | "originalArtist" | "originalYear" | "fileOwner" | "artist" | "performerInfo" | "conductor" | "remixArtist" | "partOfSet" | "publisher" | "trackNumber" | "recordingDates" | "internetRadioName" | "internetRadioOwner" | "size" | "ISRC" | "encodingTechnology" | "year";
export type FrameName = "TALB" | "TBPM" | "TCOM" | "TCON" | "TCOP" | "TDAT" | "TDLY" | "TENC" | "TEXT" | "TFLT" | "TIME" | "TIT1" | "TIT2" | "TIT3" | "TKEY" | "TLAN" | "TLEN" | "TMED" | "TOAL" | "TOFN" | "TOLY" | "TOPE" | "TORY" | "TOWN" | "TPE1" | "TPE2" | "TPE3" | "TPE4" | "TPOS" | "TPUB" | "TRCK" | "TRDA" | "TRSN" | "TRSO" | "TSIZ" | "TSRC" | "TSSE" | "TYER";

export type SpecialFrameName = "COMM" | "APIC" | "USLT" | "TXXX";
export type SpecialFrameAlias = "comment" | "image" | "unsynchronisedLyrics" | "userDefinedText";

export type AllFrameNames = V2FrameName | FrameName | SpecialFrameName | V2SpecialFrameName;
export type AllFrameAliases = V2FrameAlias | FrameAlias | SpecialFrameAlias | V2SpecialFrameAlias;

type TextFrames = {[key in FrameAlias]?: string};

/**
 * A special text frame
 */
export interface ISpecialTextFrame {
	/**
	 * The text of the frame
	 */
	text: string;

	/**
	 * The language of text frame
	 */
	language?: string;

	/**
	 * The descriptor of the text frame
	 */
	shortText: string;
}

/**
 * A user defined text frame
 */
export interface IUserDefinedTextFrame {
	/**
	 * The descriptor
	 */
	description: string;

	/**
	 * The value
	 */
	value: string;
}

/**
 * All of the possible ID3 frames
 */
export interface IFrames extends TextFrames {
	/**
	 * A comment frame
	 */
	comment?: ISpecialTextFrame;

	/**
	 * An image frame
	 */
	image?: Buffer | string;

	/**
	 * The unsynchronised lyrics
	 */
	unsynchronisedLyrics?: ISpecialTextFrame;

	/**
	 * User defined text
	 */
	userDefinedText?: IUserDefinedTextFrame[] | IUserDefinedTextFrame;
}

/**
 * A class which holds all the information about specific frames
 */
export default class FrameDefinitions {
	/**
	 * Standard text frames, these are all a pair of ke
	 */
	public static textFrames: {[key in FrameAlias]: FrameName} = {
		album: "TALB",
		bpm: "TBPM",
		composer: "TCOM",
		genre: "TCON",
		copyright: "TCOP",
		date: "TDAT",
		playlistDelay: "TDLY",
		encodedBy: "TENC",
		textWriter: "TEXT",
		fileType: "TFLT",
		time: "TIME",
		contentGroup: "TIT1",
		title: "TIT2",
		subtitle: "TIT3",
		initialKey: "TKEY",
		language: "TLAN",
		length: "TLEN",
		mediaType: "TMED",
		originalTitle: "TOAL",
		originalFilename: "TOFN",
		originalTextwriter: "TOLY",
		originalArtist: "TOPE",
		originalYear: "TORY",
		fileOwner: "TOWN",
		artist: "TPE1",
		performerInfo: "TPE2",
		conductor: "TPE3",
		remixArtist: "TPE4",
		partOfSet: "TPOS",
		publisher: "TPUB",
		trackNumber: "TRCK",
		recordingDates: "TRDA",
		internetRadioName: "TRSN",
		internetRadioOwner: "TRSO",
		size: "TSIZ",
		ISRC: "TSRC",
		encodingTechnology: "TSSE",
		year: "TYER"
	};

	/**
	 * The text frames in ID3 v2.2.0
	 */
	public static textFramesV220: {[key in V2FrameAlias]: V2FrameName} = {
		album: "TAL",
		bpm: "TBP",
		composer: "TCM",
		genre: "TCO",
		copyright: "TCR",
		date: "TDA",
		playlistDelay: "TDY",
		encodedBy: "TEN",
		textWriter: "TXT",
		fileType: "TFT",
		time: "TIM",
		contentGroup: "TT1",
		title: "TT2",
		subtitle: "TT3",
		initialKey: "TKE",
		language: "TLA",
		length: "TLE",
		mediaType: "TMT",
		originalTitle: "TOT",
		originalFilename: "TOF",
		originalTextwriter: "TOL",
		originalArtist: "TOA",
		originalYear: "TOR",
		artist: "TP1",
		performerInfo: "TP2",
		conductor: "TP3",
		remixArtist: "TP4",
		partOfSet: "TPA",
		publisher: "TPB",
		trackNumber: "TRK",
		recordingDates: "TRD",
		size: "TSI",
		ISRC: "TRC",
		encodingTechnology: "TSS",
		year: "TYE"
	};

	/**
	 * Special frames
	 */
	public static specialFrames: {[key in SpecialFrameAlias]: SpecialFrameName} = {
		comment: "COMM",
		image: "APIC",
		unsynchronisedLyrics: "USLT",
		userDefinedText: "TXXX"
	};

	/**
	 * Special frames in ID3 v2.2.0
	 */
	public static specialFramesV220: {[key in V2SpecialFrameAlias]: V2SpecialFrameName} = {
		image: "PIC"
	};

	/**
	 * Convert an ID3 frame name to it's alias
	 * @param frameName - The frame name to convert
	 * @returns - The frame alias
	 */
	public static convertNameToAlias(frameName: AllFrameNames){
		return flipObject({
			...this.textFrames,
			...this.specialFrames,
			...this.textFramesV220,
			...this.specialFramesV220
		})[frameName];
	}

	/**
	 * Convert a frame's alias to it's ID3 name counterpart
	 * @param frameAlias - The alias to convert
	 * @returns - The name
	 */
	public static convertAliasToName(frameAlias: AllFrameAliases) {
		return {
			...this.textFrames,
			...this.specialFrames
		}[frameAlias];
	}

	/**
	 * Whether or not there can be more than one frame of this type in an ID3 tag
	 * @param frameName - The name of the frame
	 * @returns Whether or not there can be more than frame of this type
	 */
	public static canHaveMultipleEntries(frameName: AllFrameNames): frameName is "TXXX" {
		return frameName === "TXXX";
	}

	/**
	 * Check if the passed frame is a text frame
	 * @param frameName - The frame to check
	 * @returns Whether or not the passed frame is a text frame
	 */
	public static isTextFrame(frameName: FrameName | SpecialFrameName){
		return frameName[0] === "T" && frameName !== "TXXX";
	}
}