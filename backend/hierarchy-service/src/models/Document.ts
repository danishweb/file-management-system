import mongoose, { Schema, Document as MDocument, Model } from "mongoose";

interface IAccess {
  userId: string;
  role: "owner" | "editor" | "viewer";
}

export interface IDocument extends MDocument {
  title: string;
  folderId: mongoose.Types.ObjectId | null;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  access: IAccess[];
}

interface DocumentModel extends Model<IDocument> {
  softDelete(documentId: string | mongoose.Types.ObjectId): Promise<void>;
}

const documentSchema = new Schema<IDocument, DocumentModel>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value: string) => /^[\w\s-]+$/.test(value),
        message: "Document title contains invalid characters",
      },
    },
    folderId: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    createdBy: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: String,
      required: true,
    },
    access: [
      {
        userId: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          enum: ["owner", "editor", "viewer"],
          required: true,
        },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create text index for search functionality
documentSchema.index({ title: "text" });

// Ensure at least one owner exists in access array
documentSchema.pre<IDocument>("save", function (next) {
  if (!this.access || !this.access.length) {
    this.access = [
      {
        userId: this.createdBy,
        role: "owner",
      },
    ];
  }

  const hasOwner = this.access.some((access) => access.role === "owner");
  if (!hasOwner) {
    throw new Error("Document must have at least one owner");
  }

  next();
});

// Ensure unique title within the same folder
documentSchema.pre<IDocument>("save", async function (next) {
  if (this.isModified("title") || this.isModified("folderId")) {
    const existingDoc = await mongoose.model<IDocument>("Document").findOne({
      _id: { $ne: this._id },
      folderId: this.folderId,
      title: this.title,
      isDeleted: false,
    });

    if (existingDoc) {
      throw new Error(
        "A document with this title already exists in the folder"
      );
    }
  }
  next();
});

// Indexes for efficient querying
documentSchema.index({ folderId: 1, title: 1, isDeleted: 1 }, { unique: true });
documentSchema.index({ "access.userId": 1, "access.role": 1 });

// Static method to soft delete a document
documentSchema.static(
  "softDelete",
  async function (documentId: string | mongoose.Types.ObjectId): Promise<void> {
    const document = await this.findById(documentId);
    if (!document || document.isDeleted) return;

    document.isDeleted = true;
    document.deletedAt = new Date();
    await document.save();
  }
);

export const Document = mongoose.model<IDocument, DocumentModel>(
  "Document",
  documentSchema
);
