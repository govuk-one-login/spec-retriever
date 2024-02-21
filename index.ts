import {Octokit} from "@octokit/rest";
import fetch from "node-fetch";
import path from "node:path";
import * as fs from "fs";
import {mkdir} from "node:fs/promises";
import {existsSync} from "node:fs";
import * as util from "util";

const streamPipeline = util.promisify(require('stream').pipeline)

type SpecMetadata = {
    owner: string;
    path: string;
    file: string;
    repo: string;
    downloadUrl: string
};

const {GITHUB_API_KEY, SEARCH_QUERY, DEST_DIR} = process.env;

const connection = new Octokit({
    auth: GITHUB_API_KEY,
    request: fetch,
});

async function findSpecs(): Promise<SpecMetadata[]> {
    const results = await connection.paginate(connection.rest.search.code, {
        q: SEARCH_QUERY!!,
    });

    console.log(`Found ${results.length} results`);

    const files: SpecMetadata[] = await asyncMap(results, async (result) => {
        const downloadUrl = await fetchDownloadUrl(result);
        return {
            /**
             * this oddly-named property refers to the org name
             */
            owner: result.repository.owner.login,
            repo: result.repository.name,
            file: result.name,
            path: result.path,
            downloadUrl,
        };
    });

    console.debug(`Results`, files);
    return files;
}

async function fetchDownloadUrl(result: any): Promise<string> {
    try {
        const params = {
            method: 'GET',
            headers: {
                "Accept": "application/vnd.github+json",
                "Authorization": `Bearer ${GITHUB_API_KEY}`,
                "X-GitHub-Api-Version": "2022-11-28",
            }
        }
        const details = await fetch(result.url, params).then((result) => result.json());
        return details.download_url;
    } catch (e) {
        throw new Error(`Error fetching details for result: ${result.url}: ${e}`);
    }
}

async function asyncMap<I, T>(arr: I[], asyncMapFn: (e: I) => Promise<T>): Promise<T[]> {
    return await Promise.all(arr.map(asyncMapFn));
}

async function downloadSpecs(specs: SpecMetadata[], destDir: string) {
    if (!existsSync(destDir)) {
        await mkdir(destDir, {recursive: true});
    }

    for (const spec of specs) {
        const destFile = path.join(destDir, spec.repo + "-" + spec.file);
        try {
            await downloadFile(spec, destFile);
        } catch (e) {
            throw new Error(`Error downloading spec ${spec.downloadUrl} to ${destFile}`);
        }
    }
}

async function downloadFile(spec: SpecMetadata, destFile: string) {
    console.debug('Downloading file', spec.downloadUrl);

    const params = {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${GITHUB_API_KEY}`,
        }
    }

    const response = await fetch(spec.downloadUrl, params);
    if (!response.ok) {
        throw new Error(`unexpected response ${response.statusText}`)
    }
    await streamPipeline(response.body, fs.createWriteStream(destFile))

    console.info('Downloaded file', destFile);
}

(async () => {
    const specs = await findSpecs();
    const destPath = path.join(process.cwd(), DEST_DIR!!);
    await downloadSpecs(specs, destPath);

})().catch((e) => {
    console.error(e);
});
