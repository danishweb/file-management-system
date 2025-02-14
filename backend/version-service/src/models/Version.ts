import mongoose, { Document as MDocument, Model, Schema } from "mongoose";

export interface IVersion extends MDocument {
  documentId: string;
  versionNumber: number;
  fileKey: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

interface IVersionModel extends Model<IVersion> {
  getLatestVersionNumber(documentId: string): Promise<number>;
  validateVersionNumber(
    documentId: string,
    versionNumber: number
  ): Promise<boolean>;
}

const versionSchema = new Schema<IVersion, IVersionModel>(
  {
    documentId: {
      type: String,
      required: [true, "Document ID is required"],
      index: true,
    },
    versionNumber: {
      type: Number,
      required: [true, "Version number is required"],
      set: function (value: number): number {
        return parseFloat(value.toFixed(1));
      },
      get: function (value: number): number {
        return parseFloat(value.toFixed(1));
      },
    },
    fileKey: {
      type: String,
      required: [true, "File key is required"],
    },
    mimeType: {
      type: String,
      required: [true, "MIME type is required"],
    },
    size: {
      type: Number,
      required: [true, "File size is required"],
      min: [0, "File size cannot be negative"],
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Compound index to ensure unique version numbers per document
versionSchema.index({ documentId: 1, versionNumber: 1 }, { unique: true });

// Static method to get the latest version number for a document
versionSchema.statics.getLatestVersionNumber = async function (
  documentId: string
): Promise<number> {
  const latest = await this.findOne(
    { documentId },
    { versionNumber: 1 },
    { sort: { versionNumber: -1 } }
  );
  return latest ? latest.versionNumber : 0;
};

// Static method to validate a version number
versionSchema.statics.validateVersionNumber = async function (
  documentId: string,
  versionNumber: number
): Promise<boolean> {
  // Get the latest version number
  const latestVersion = await this.findOne(
    { documentId },
    { versionNumber: 1 },
    { sort: { versionNumber: -1 } }
  );

  if (!latestVersion) {
    // If no versions exist, only allow 1.0
    return versionNumber === 1.0;
  }

  const latestMajor = Math.floor(latestVersion.versionNumber);
  const latestMinor = parseInt((latestVersion.versionNumber % 1).toFixed(1).substring(2));
  const newMajor = Math.floor(versionNumber);
  const newMinor = parseInt((versionNumber % 1).toFixed(1).substring(2));

  // Allow same major version with incremented minor version
  if (newMajor === latestMajor) {
    return newMinor === latestMinor + 1;
  }

  // Allow next major version only with .0
  if (newMajor === latestMajor + 1) {
    return newMinor === 0;
  }

  return false;
};

export const Version = mongoose.model<IVersion, IVersionModel>(
  "Version",
  versionSchema
);
