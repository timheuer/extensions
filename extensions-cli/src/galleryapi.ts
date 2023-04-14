import {
	PublishedExtension,
	ExtensionQueryFlags,
	ExtensionQueryFilterType,
	FilterCriteria,
	TypeInfo,
} from "azure-devops-node-api/interfaces/GalleryInterfaces";
import { ContractSerializer } from "azure-devops-node-api/Serialization";
import { ExtensionVersionGroup, getLatestExtensionVersion, VersionDetails } from "./util";
import path from "path";
import * as fs from "fs";
export interface VSCodePublishedExtension extends PublishedExtension {
	publisher: { displayName: string; publisherName: string };
}

export interface ExtensionQuery {
	readonly pageNumber?: number;
	readonly pageSize?: number;
	readonly flags?: ExtensionQueryFlags[];
	readonly criteria?: FilterCriteria[];
	readonly assetTypes?: string[];
}

export class GalleryApi {
	constructor(public baseUrl: string, public apiVersion: string) {}

	async queryApi({
		pageNumber = 1,
		pageSize = 1,
		flags = [],
		criteria = [],
		assetTypes = [],
	}: ExtensionQuery): Promise<VSCodePublishedExtension[]> {
		const data = JSON.stringify({
			filters: [{ pageNumber, pageSize, criteria }],
			assetTypes,
			flags: flags.reduce((a, b) => a | b, 0),
		});

		const response = await fetch(`${this.baseUrl}/extensionquery`, {
			method: "POST",
			body: data,
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json;api-version=" + this.apiVersion,
			},
		});
		if (!response.ok) {
			return [];
		}

		const responseData = await response.json();

		return ContractSerializer.deserialize(
			responseData.results[0].extensions,
			TypeInfo.PublishedExtension,
			false,
			false
		);
	}

	downloadExtension(extension: VSCodePublishedExtension, version: string | undefined) {
		const extensionVersion = getLatestExtensionVersion(extension, version);
		extensionVersion.details.forEach(async (element) => {
			const response = await this.downloadPayload(extension, element);
			this.savePayload(response);
		});
	}

	async downloadPayload(
		extension: VSCodePublishedExtension,
		versionDetails: VersionDetails
	): Promise<{ filename: string; data: Buffer }> {
		const response = await fetch(versionDetails.assetUrl, {
			method: "GET",
			headers: {
				Accept: "application/octet-stream",
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to download extension ${extension.extensionName}`);
		}

		const extensionFilename = this.getFilename(extension, versionDetails);
		console.log(`Downloading ${extensionFilename}`);

		const contentLength = response.headers.get("Content-Length");
		const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
		let downloadedBytes = 0;

		const reader = response.body!.getReader();
		const chunks: Uint8Array[] = [];

		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}

			downloadedBytes += value!.length;
			chunks.push(value!);

			// Calculate progress percentage
			// const progress = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;
			// console.log(`Downloaded ${progress.toFixed(2)}%`);

			// You can also update a progress bar or display a message to the user here
		}

		const blob = new Blob(chunks);
		const buffer = await blob.arrayBuffer();
		return { filename: extensionFilename, data: Buffer.from(buffer) };
	}

	savePayload(response: { filename: string; data: Buffer }) {
		const filePath = path.join(__dirname, response.filename);
		fs.writeFile(filePath, response.data, (err) => {
			if (err) {
				console.error(err);
			}
		});
		console.log(`Saved ${response.filename}`);
	}

	getFilename(extension: VSCodePublishedExtension, extensDetails: VersionDetails): string {
		const version = extensDetails.version;
		const targetPlatform = extensDetails.targetPlatform;

		if (targetPlatform === undefined) {
			return `${extension.publisher.publisherName}.${extension.extensionName}-${version}.vsix`;
		} else {
			return `${extension.publisher.publisherName}.${extension.extensionName}-${version}@${targetPlatform}.vsix`;
		}
	}

	async getExtensionById(id: string): Promise<VSCodePublishedExtension | undefined> {
		const flags = [
			ExtensionQueryFlags.IncludeVersions,
			ExtensionQueryFlags.IncludeFiles,
			ExtensionQueryFlags.IncludeMetadata,
		];
		const query = { criteria: [{ filterType: ExtensionQueryFilterType.Name, value: id }], flags };
		const extensions = await this.queryApi(query);

		if (extensions.length === 0) {
			return undefined;
		}

		return extensions.filter(
			({ publisher: { publisherName: publisher }, extensionName: name }) =>
				id.toLowerCase() === `${publisher}.${name}`.toLowerCase()
		)[0];
	}
}
