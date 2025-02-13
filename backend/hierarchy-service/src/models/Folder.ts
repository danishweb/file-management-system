import mongoose, {
  Document,
  Schema,
  Model,
  CallbackError,
  Types,
} from "mongoose";

export interface IFolder extends Document {
  name: string;
  userId: string;
  parentFolder: Types.ObjectId | null;
  path: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface IFolderModel extends Model<IFolder> {
  softDelete(folderId: string | Types.ObjectId): Promise<void>;
}

const folderSchema = new Schema<IFolder, IFolderModel>(
  {
    name: {
      type: String,
      required: [true, "Folder name is required"],
      trim: true,
      maxlength: [255, "Folder name cannot be longer than 255 characters"],
      validate: {
        validator: function (value: string) {
          return !/[<>:"/\\|?*\x00-\x1F]/.test(value); // Invalid characters in folder names
        },
        message: "Folder name contains invalid characters",
      },
    },
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    parentFolder: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
      validate: {
        validator: async function (value: Types.ObjectId | null) {
          if (!value) return true;
          const folder = await mongoose.model("Folder").findById(value);
          return !!folder && !folder.isDeleted;
        },
        message: "Parent folder does not exist or is deleted",
      },
    },
    path: {
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
folderSchema.index(
  { userId: 1, parentFolder: 1, name: 1, isDeleted: 1 },
  { unique: true }
);
folderSchema.index({ path: 1 });

// Pre-save middleware to generate path
folderSchema.pre("save", async function (next) {
  if (this.isModified("name") || this.isModified("parentFolder")) {
    try {
      let path = this.name;
      let current = this;

      // Build path by traversing up the folder tree
      while (current.parentFolder) {
        const parent = await mongoose
          .model("Folder")
          .findById(current.parentFolder);
        if (!parent || parent.isDeleted) break;
        path = `${parent.name}/${path}`;
        current = parent;
      }

      this.path = path;
    } catch (error) {
      return next(error as CallbackError);
    }
  }
  next();
});

// Static method to soft delete a folder and its contents
folderSchema.statics.softDelete = async function (
  folderId: string | Types.ObjectId
): Promise<void> {
  const folder = await this.findById(folderId);
  if (!folder) {
    throw new Error("Folder not found");
  }

  const now = new Date();

  // Soft delete all documents in this folder
  await mongoose
    .model("Document")
    .updateMany(
      { folderId: folder._id, isDeleted: false },
      { isDeleted: true, deletedAt: now }
    );

  // Recursively soft delete all subfolders
  const FolderModel = mongoose.model<IFolder, IFolderModel>("Folder");
  const subfolders = await this.find({
    parentFolder: folder._id,
    isDeleted: false,
  });
  for (const subfolder of subfolders) {
    await FolderModel.softDelete((subfolder._id as Types.ObjectId).toString());
  }

  // Soft delete the current folder
  folder.isDeleted = true;
  folder.deletedAt = now;
  await folder.save();
};

// Query middleware to exclude soft-deleted folders by default
folderSchema.pre(/^find/, function (next) {
  if (!(this as any)._conditions.includeDeleted) {
    (this as any).where({ isDeleted: false });
  }
  delete (this as any)._conditions.includeDeleted;
  next();
});

export const Folder = mongoose.model<IFolder, IFolderModel>(
  "Folder",
  folderSchema
);
