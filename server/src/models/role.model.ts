import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPermission extends Document {
  _id: mongoose.Types.ObjectId
  key: string
  label: string
}

export interface IRole extends Document {
  _id: mongoose.Types.ObjectId
  key: string
  name: string
  permissions: mongoose.Types.ObjectId[]
  createdAt: Date
}

export interface IStaffRole extends Document {
  staffId: mongoose.Types.ObjectId
  roleId: mongoose.Types.ObjectId
}

const PermissionSchema = new Schema<IPermission>({
  key: { type: String, required: true, unique: true },
  label: { type: String, required: true },
})

const RoleSchema = new Schema<IRole>(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
  },
  { timestamps: true },
)

const StaffRoleSchema = new Schema<IStaffRole>({
  staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
  roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
})

StaffRoleSchema.index({ staffId: 1, roleId: 1 }, { unique: true })

export const PermissionModel: Model<IPermission> =
  mongoose.models.Permission ?? mongoose.model<IPermission>('Permission', PermissionSchema)

export const RoleModel: Model<IRole> =
  mongoose.models.Role ?? mongoose.model<IRole>('Role', RoleSchema)

export const StaffRoleModel: Model<IStaffRole> =
  mongoose.models.StaffRole ?? mongoose.model<IStaffRole>('StaffRole', StaffRoleSchema)
