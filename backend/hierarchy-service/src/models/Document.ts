import mongoose, { Document as MDocument, Schema, Model, Types } from "mongoose";

export interface IDocument extends MDocument {
  title: string;
  userId: string;
  folderId: Types.ObjectId | null;
  content: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface IDocumentModel extends Model<IDocument> {
  softDelete(documentId: string | Types.ObjectId): Promise<void>;
}

const documentSchema = new Schema<IDocument, IDocumentModel>(
  {
    title: {
      type: String,
      required: [true, "Document title is required"],
      trim: true,
      maxlength: [255, "Document title cannot be longer than 255 characters"],
    },
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    folderId: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
      validate: {
        validator: async function(value: Types.ObjectId | null) {
          if (!value) return true;
          const folder = await mongoose.model("Folder").findById(value);
          return !!folder && !folder.isDeleted;
        },
        message: "Folder does not exist or is deleted",
      },
    },
    content: {
      type: String,
      default: "",
    },
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

// Indexes for efficient querying
documentSchema.index({ userId: 1, folderId: 1, isDeleted: 1 });
documentSchema.index({ title: "text", content: "text" });

// Pre-save middleware to ensure unique titles within the same folder
documentSchema.pre("save", async function(next) {
  if (this.isModified("title") || this.isModified("folderId")) {
    const DocumentModel = mongoose.model<IDocument>("Document");
    const existingDoc = await DocumentModel.findOne({
      title: this.title,
      folderId: this.folderId,
      userId: this.userId,
      isDeleted: false,
      _id: { $ne: this._id },
    });
    if (existingDoc) {
      next(new Error("A document with this name already exists in this folder"));
    }
  }
  next();
});

// Static method to soft delete a document
documentSchema.statics.softDelete = async function(documentId: string | Types.ObjectId): Promise<void> {
  const document = await this.findById(documentId);
  if (!document) {
    throw new Error("Document not found");
  }
  
  document.isDeleted = true;
  document.deletedAt = new Date();
  await document.save();
};

// Query middleware to exclude soft-deleted documents by default
documentSchema.pre(/^find/, function(next) {
  if (!(this as any)._conditions.includeDeleted) {
    (this as any).where({ isDeleted: false });
  }
  delete (this as any)._conditions.includeDeleted;
  next();
});

export const Document = mongoose.model<IDocument, IDocumentModel>("Document", documentSchema);
