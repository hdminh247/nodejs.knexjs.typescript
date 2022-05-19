import multer from "multer";
import AWS from "aws-sdk";
import * as path from "path";
import q from "q";
import fs from "fs";
import User from "../../models/user";

// Accepted upload image type
const acceptedImageType = "image/jpg, image/jpeg, image/jps, image/png, image/gif, application/pdf";

export default class ImageService {
  private uploadInstance: any;
  private uploadDestination: string;
  private s3Configs: any;
  private localConfigs: any;
  private s3Instance: any;
  private multerInstance: any;

  constructor(type: string, isMultiple = false) {
    const { s3, local } = {
      local: {
        localStoragePath: process.env.LOCAL_IMAGE_SAVE_PATH,
        imageUploadSizeLimit: parseInt(process.env.LOCAL_IMAGE_UPLOAD_SIZE_LIMIT || "10"), // 10 MB as default
      },
      s3: {
        bucket: process.env.S3_BUCKET,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        region: process.env.S3_REGION,
        imageUploadSizeLimit: parseInt(process.env.S3_IMAGE_UPLOAD_SIZE_LIMIT || "10"), // 10 MB as default
      },
    };

    this.uploadDestination = type;
    this.s3Configs = s3;
    this.localConfigs = local;

    // File filter, only accept specific image files
    const fileFilter = (req: any, file: any, callback: any) => {
      if (acceptedImageType.indexOf(file.mimetype) === -1) {
        callback(new Error("Accept only file types: " + acceptedImageType));
      }
      callback(null, true);
    };

    // Init upload instance
    switch (type) {
      case "local": {
        this.multerInstance = multer({
          fileFilter,
          limits: {
            fileSize: this.s3Configs.imageUploadSizeLimit * (1024 * 1024), // [Limit size] x 1MB (1*1024*1024)
          },
        });

        this.uploadInstance = isMultiple ? this.multerInstance.array("file", 10) : this.multerInstance.single("file");

        break;
      }

      case "s3": {
        this.s3Instance = new AWS.S3({
          secretAccessKey: this.s3Configs.secretAccessKey,
          accessKeyId: this.s3Configs.accessKeyId,
          region: this.s3Configs.region,
        });

        // Init upload instance
        this.uploadInstance = multer({
          fileFilter,
          limits: {
            fileSize: this.s3Configs.imageUploadSizeLimit * (1024 * 1024), // [Limit size] x 1MB (1*1024*1024)
          },
        }).single("file");
        break;
      }
    }
  }

  // Process form data from request
  public async processFormData(req: any, res: any): Promise<any> {
    const defer = q.defer();

    // Start to upload images
    this.uploadInstance(req, res, (err: any) => {
      if (err) {
        // Error

        if (err.message === "Unexpected field") {
          err.message = "Maximum image is 10";
        }

        defer.resolve({
          error: true,
          message: err.message,
        });
      } else {
        defer.resolve();
      }
    });
    return defer.promise;
  }

  getTypeByExtension = (extension: string) => {
    switch (extension) {
      case "png": {
        return "image";
      }
      case "jpeg": {
        return "image";
      }
      case "jpg": {
        return "image";
      }
      case "pdf": {
        return "pdf";
      }
      default: {
        return "image";
      }
    }
  };

  // Upload multiple file
  public async uploadMultipleFiles(files: any[], userId: number): Promise<any> {
    const resData = [];
    for (let i = 0; i < files.length; i++) {
      const image = await this.upload(files[i], userId);
      resData.push(image);
    }
    return resData;
  }

  public async removeFileFromStorage(filePath: string): Promise<boolean> {
    if (this.uploadDestination === "local") {
      try {
        // @ts-ignore
        const splitNames = filePath.split(`${process.env.FILE_BASE_PATH}/`);
        fs.unlinkSync(`${this.localConfigs.localStoragePath}/${splitNames[1]}`);
      } catch (e) {
        return false;
      }
    }

    return true;
  }

  // Upload file
  public async upload(file: any, userId: number): Promise<any> {
    const defer = q.defer();

    const fileName = `${path.basename(file.originalname).split(".")[0]}-${new Date().getTime()}${path.extname(
      file.originalname,
    )}`;
    const writeFilePath = `${this.localConfigs.localStoragePath}/${fileName}`;
    const saveFileUrl = `${process.env.FILE_BASE_PATH}/${fileName}`;

    // Local Upload
    if (this.uploadDestination === "local") {
      await fs.writeFile(writeFilePath, file.buffer, async (err) => {
        if (err) {
          defer.resolve({
            error: true,
            message: err.message,
          });
        } else {
          const insertData: any = {
            name: file.originalname,
            extension: path.extname(file.originalname),
            type: "image",
            storageType: "local",
            path: saveFileUrl,
          };

          // Insert to file table
          const results = await User.relatedQuery("files").for(userId).insert(insertData);

          defer.resolve({
            error: false,
            fileKey: results["fileKey"],
            name: file.originalname,
            type: this.getTypeByExtension(path.extname(file.originalname).split(".")[1]),
            savedFileName: fileName,
            saveFileUrl,
          });
        }
      });
    }

    // S3 Upload
    if (this.uploadDestination === "s3") {
      // Create image data
      // TODO: Insert to image table here ?

      const params = {
        Bucket: this.s3Configs.bucket,
        // Key:  `files/${teamId}/${type}/${storageId}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: { fieldname: file.fieldname },
        ACL: "private",
      };

      await this.s3Instance.upload(params, (err: any, data: any) => {
        if (err) {
          defer.resolve({
            error: true,
            message: err.message,
          });
        } else {
          defer.resolve({
            error: false,
            imageUrl: data.Location,
            type: file.mimetype,
          });
        }
      });
    }

    return defer.promise;
  }
}
