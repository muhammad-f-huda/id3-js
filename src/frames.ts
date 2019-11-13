/**
 * The aliases of all the normal tags
 */
export type TextTagAlias = "album" | "bpm" | "composer" | "genre" | "copyright" | "date" | "playlistDelay" | "encodedBy" | "textWriter" | "fileType" | "time" | "contentGroup" | "title" | "subtitle" | "initialKey" | "language" | "length" | "mediaType" | "originalTitle" | "originalFilename" | "originalTextwriter" | "originalArtist" | "originalYear" | "fileOwner" | "artist" | "performerInfo" | "conductor" | "remixArtist" | "partOfSet" | "publisher" | "trackNumber" | "recordingDates" | "internetRadioName" | "internetRadioOwner" | "size" | "ISRC" | "encodingTechnology" | "year";

/**
 * The aliases of all special tags
 */
export type SpecialTagAlias = "comment" | "image" | "unsynchronisedLyrics" | "userDefinedText";

/**
 * The names of all the normal tags
 */
export type TextTagName = "TALB" | "TBPM" | "TCOM" | "TCON" | "TCOP" | "TDAT" | "TDLY" | "TENC" | "TEXT" | "TFLT" | "TIME" | "TIT1" | "TIT2" | "TIT3" | "TKEY" | "TLAN" | "TLEN" | "TMED" | "TOAL" | "TOFN" | "TOLY" | "TOPE" | "TORY" | "TOWN" | "TPE1" | "TPE2" | "TPE3" | "TPE4" | "TPOS" | "TPUB" | "TRCK" | "TRDA" | "TRSN" | "TRSO" | "TSIZ" | "TSRC" | "TSSE" | "TYER";

/**
 * The names of all the special tags
 */
export type SpecialTagName = "COMM" | "APIC" | "USLT" | "TXXX" | "PIC";

/**
 * The aliases of all tags
 */
export type TagAlias = TextTagAlias | SpecialTagAlias;

/**
 * The names of all tags
 */
export type TagName = TextTagName | SpecialTagName;

/**
 * All of the tags
 */
type TextTags = {[key in TextTagAlias]?: string};

/**
 * A special text tag
 */
export interface ISpecialTextTag {
	/**
	 * The text of the comment
	 */
	text: string;

	/**
	 * The language of the comment
	 */
	language: string;

	/**
	 * The descriptor of the comment
	 */
	shortText: string;
}

/**
 * A user defined text tag
 */
export interface IUserDefinedText {
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
 * ID3 tags
 */
export interface ITags extends TextTags {
	/**
	 * A comment tag
	 */
	comment?: ISpecialTextTag;

	/**
	 * An image tag
	 */
	image?: Buffer | string;

	/**
	 * The unsynchronised lyrics
	 */
	unsynchronisedLyrics?: ISpecialTextTag;

	/**
	 * User defined text
	 */
	userDefinedText?: IUserDefinedText[] | IUserDefinedText;
}

/**
 * List of official text information frames
 * LibraryName: "T***"
 * Value is the ID of the text frame specified in the link above,
 * the object's keys are just for simplicity, you can also use the ID directly.
 */
export const TFrames = {
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

export const TFramesV220 = {
	album: "TAL",
	bpm: "TBP",
	composer: "TCM",
	genre: "TCO",
	copyright: "TCR",
	date: "TDA",
	playlistDelay: "TDY",
	encodedBy: "TEN",
	textWriter: "TEXT",
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

export const specialFrameTags = {
	comment: "COMM",
	image: "APIC",
	unsynchronisedLyrics: "USLT",
	userDefinedText: "TXXX"
};

export const specialFrameTagsV220 = {
	image: "PIC"
};