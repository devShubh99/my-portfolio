/**
 * Storage module — pluggable file storage interface.
 * Default: LocalStorage (saves to ./uploads).
 * Swap to S3 by changing STORAGE_PROVIDER in .env.
 */

import fs from "fs";
import path from "path";

interface StorageProvider {
    save(filename: string, data: Buffer): Promise<string>;
    delete(filepath: string): Promise<void>;
    getUrl(filepath: string): string;
}

// ── Local Disk Storage (default) ──
class LocalStorage implements StorageProvider {
    private basePath: string;

    constructor() {
        this.basePath = process.env.STORAGE_LOCAL_PATH || "./uploads";
        // Ensure directory exists
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
    }

    async save(filename: string, data: Buffer): Promise<string> {
        const filepath = path.join(this.basePath, filename);
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filepath, data);
        return `/uploads/${filename}`;
    }

    async delete(filepath: string): Promise<void> {
        const fullPath = path.join(this.basePath, path.basename(filepath));
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }

    getUrl(filepath: string): string {
        return filepath; // Already a relative URL
    }
}

// ── S3 Storage (placeholder) ──
class S3Storage implements StorageProvider {
    async save(filename: string, data: Buffer): Promise<string> {
        // To implement: use @aws-sdk/client-s3
        // const client = new S3Client({ region: process.env.AWS_REGION });
        // await client.send(new PutObjectCommand(...));
        console.log("[S3 Storage] Would upload:", filename);
        return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${filename}`;
    }

    async delete(filepath: string): Promise<void> {
        console.log("[S3 Storage] Would delete:", filepath);
    }

    getUrl(filepath: string): string {
        return filepath;
    }
}

// ── Factory ──
function createStorage(): StorageProvider {
    const provider = process.env.STORAGE_PROVIDER || "local";
    switch (provider) {
        case "s3":
            return new S3Storage();
        case "local":
        default:
            return new LocalStorage();
    }
}

const storage = createStorage();
export default storage;
