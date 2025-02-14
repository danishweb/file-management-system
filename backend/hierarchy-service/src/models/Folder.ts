import mongoose, { Schema, Document as MDocument, Model } from "mongoose";

export interface IAccess {
  userId: string;
  role: "owner" | "editor" | "viewer";
}

export interface IFolder extends MDocument {
  name: string;
  parentId: mongoose.Types.ObjectId | null;
  path: string;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  access: IAccess[];
}

interface FolderModel extends Model<IFolder> {
  generatePath(folder: IFolder): Promise<string>;
}

const folderSchema = new Schema<IFolder, FolderModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value: string) => /^[\w\s-]+$/.test(value),
        message: "Folder name contains invalid characters",
      },
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    path: {
      type: String,

      default: "",
    },
    createdBy: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: String,
      required: true,
    },
    deletedBy: {
      type: String,
      default: null,
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

// Ensure at least one owner exists in access array
folderSchema.pre<IFolder>("save", function (next) {
  if (!this.access || !this.access.length) {
    this.access = [{ userId: this.createdBy, role: "owner" }];
  }

  const hasOwner = this.access.some((access) => access.role === "owner");
  if (!hasOwner) {
    throw new Error("Folder must have at least one owner");
  }

  next();
});

// Path generation method
folderSchema.statics.generatePath = async function (
  folder: IFolder
): Promise<string> {
  if (!folder.parentId) {
    return `/${folder.name}`;
  }

  const parent = await this.findById(folder.parentId);
  if (!parent) {
    throw new Error("Parent folder not found");
  }

  return `${parent.path}/${folder.name}`;
};

// Pre-save middleware to generate path
folderSchema.pre("save", async function (next) {
  try {
    if (this.isModified("name") || this.isModified("parentId")) {
      this.path = await (this.constructor as FolderModel).generatePath(this);
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Indexes for efficient querying
folderSchema.index({ parentId: 1, name: 1, isDeleted: 1 }, { unique: true });
folderSchema.index({ path: 1 });
folderSchema.index({ "access.userId": 1, "access.role": 1 });

export const Folder = mongoose.model<IFolder, FolderModel>(
  "Folder",
  folderSchema
);
