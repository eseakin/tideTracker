import { InboxOutlined } from "@ant-design/icons"
import { Upload } from "antd"
import { InternalUploadFile } from "antd/es/upload/interface"
import { UploadTaskSnapshot } from "firebase/storage"

import Firestore from "#classes/Firestore"

import type { UploadProps } from "antd"

const DEFAULT_UPLOAD_PROPS: UploadProps = {
  multiple: false,
  headers: {
    authorization: "authorization-text",
    "Content-Type": "image/jpeg",
    "cross-origin": "",
  },
  showUploadList: true,
}

/**
 * Upload props from antd:
 * @param onChange - Callback called on every status change - 'uploading', 'done', 'error'
 * @param onDrop - Callback called when a file is dropped - Just provides a synthetic event with no file info
 */

const Uploader = ({
  onStatusChange,
  onDelete,
  folder,
  filename,
  metadata,
  fileList,
}: {
  onStatusChange: UploadProps["onChange"]
  onDelete: UploadProps["onRemove"]
  folder: string
  filename: string
  metadata: Record<string, unknown>
  fileList?: InternalUploadFile[]
}) => {
  const customRequest: UploadProps["customRequest"] = async ({
    file,
    onSuccess,
    onError,
    onProgress,
  }) => {
    console.log("✅🔥 Uploader file => ", file)
    const handleProgress = (snapshot: UploadTaskSnapshot) => {
      const percent = Math.round(
        (snapshot.bytesTransferred / snapshot.totalBytes) * 100
      )
      onProgress?.({ percent })
    }

    // file.uid exists as far as I can tell but Antd has some squirrely types
    const uid =
      typeof file === "string"
        ? file
        : "uid" in file
          ? file.uid
          : `file-${Date.now()}`

    const handleSuccess = (url: string) => {
      onSuccess?.(url, file)
    }

    try {
      await Firestore.getInstance().uploadFile(
        // Antd UploadRequestFile has the required API for File
        file as File,
        `${folder}/${filename}`,
        metadata,
        handleProgress,
        // Antd's onSuccess requires some args we don't care about
        handleSuccess
      )
    } catch (err: unknown) {
      onError?.(err)
    }
  }

  const files = fileList?.length ? fileList : undefined

  return (
    <Upload.Dragger
      {...DEFAULT_UPLOAD_PROPS}
      onChange={onStatusChange}
      onRemove={onDelete}
      customRequest={customRequest}
      fileList={files}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p>Click or drag file here to upload</p>
    </Upload.Dragger>
  )
}

export default Uploader
