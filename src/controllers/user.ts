import { Request, Response, NextFunction } from "express";

// Utils
import HttpResponse from "../services/response";
import { pageLimit } from "../constants";
import User from "../models/user";
import ImageService from "../services/image";
import File from "../models/file";
import encryptionUtils from "../utils/encryption";
import encryption from "../utils/encryption";
/**
 * @swagger
 * tags:
 *   - name: User
 *     description: User
 */

/**
 * @swagger
 * /v1/user/profile:
 *   get:
 *     description: Get profile API
 *     tags: [User]
 *     produces:
 *       - application/json
 *     security:
 *          - auth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid request params
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Resource not found
 */

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // @ts-ignore
    const { user } = req;

    return HttpResponse.returnSuccessResponse(res, user);
  } catch (err: any) {
    next(err);
  }
};

/**
 * @swagger
 * /v1/users:
 *   get:
 *     description: Get user API
 *     tags: [User]
 *     produces:
 *       - application/json
 *     security:
 *          - auth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         type: integer
 *         default: 1
 *         description: Page
 *       - name: search
 *         in: query
 *         type: string
 *         description: Keyword to find user
 *       - name: ignoreMe
 *         in: query
 *         type: string
 *         description: Define if whether results include current user data or not
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid request params
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Resource not found
 */

export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { query } = req;
    const { page = 1, search, ignoreMe } = query;
    const { id } = req["user"];

    const { organizationKey } = req["user"];

    let baseQuery = User.query().where({ organizationKey });

    // Ignore current user in result
    if (parseInt(ignoreMe as string) === 1) {
      baseQuery = baseQuery.whereNot({ id });
    }

    if (search) {
      baseQuery = baseQuery.whereRaw(`LOWER(display_name) like '${`%${search.toString().toLowerCase()}%`}'`);
    }

    const users = await baseQuery.orderBy("createdAt", "desc");

    // The complexity of the queries prevents pagination using the DB queries (see https://vincit.github.io/objection.js/api/query-builder/eager-methods.html#withgraphjoined)
    // A more "provisional" pagination must be made in order to paginate the resultset sent to the client
    const offset = (Number(page) - 1) * pageLimit;

    const paginatedBatches = users.slice(offset, offset + pageLimit);

    return HttpResponse.returnSuccessResponse(res, {
      total: users.length,
      results: paginatedBatches,
      next: offset + pageLimit < users.length ? Number(page) + 1 : -1,
    });
  } catch (err: any) {
    next(err);
  }
};

/**
 * @swagger
 * /v1/user/profile:
 *   put:
 *     description: Update user profile API
 *     tags: [User]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: fullName
 *         in: formData
 *         required: true
 *         description: Full Name
 *         paramType: formData
 *         type: string
 *       - name: file
 *         in: formData
 *         required: true
 *         description: Avatar
 *         paramType: formData
 *         type: file
 *     security:
 *          - auth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid request params
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Resource not found
 */

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // Init image service
    const imageService = new ImageService("local");

    // Process form data
    const imageResponse = await imageService.processFormData(req, res);

    // Return error
    if (imageResponse && imageResponse.error) {
      return HttpResponse.returnBadRequestResponse(res, imageResponse.message);
    }

    const { body, file } = req;
    const { id, avatar } = req["user"];

    if (file) {
      // Upload image first
      const fileInsert = await imageService.upload(file, id);
      body.avatar = fileInsert.fileKey;

      // Remove old file first from storage
      imageService.removeFileFromStorage(req["user"].userAvatar.path);
    }

    const user = await User.query().findOne({ id }).update(body);

    if (file) {
      // Remove old avatar from db
      await File.query().deleteById(avatar);
    }

    return HttpResponse.returnSuccessResponse(res, { user });
  } catch (err: any) {
    next(err);
  }
};

/**
 * @swagger
 * definitions:
 *   ChangePassword:
 *     required:
 *       - oldPassword
 *       - newPassword
 *       - confirmPassword
 *     properties:
 *       oldPassword:
 *         type: string
 *       newPassword:
 *         type: string
 *       confirmPassword:
 *         type: string
 */

/**
 * @swagger
 * /v1/user/password:
 *   put:
 *     description: Change user password API
 *     tags: [User]
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Request body
 *         schema:
 *           $ref: '#definitions/ChangePassword'
 *           type: object
 *     security:
 *          - auth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid request params
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Resource not found
 */

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const {
      body: { oldPassword, newPassword, confirmPassword },
    } = req;
    const { id } = req["user"];

    // Get current user password
    const userInfo = await User.query().findById(id);

    const passwordMatch = encryptionUtils.checkPassword(oldPassword, userInfo.password);

    if (!passwordMatch) {
      return HttpResponse.returnBadRequestResponse(res, "auth.oldPassword.not.match");
    }

    if (newPassword !== confirmPassword) {
      return HttpResponse.returnBadRequestResponse(res, "auth.newPassword.confirmPassword.not.match");
    }

    const user = await User.query()
      .findOne({ id })
      .update({ password: encryption.hashPassword(newPassword) });

    return HttpResponse.returnSuccessResponse(res, { user });
  } catch (err: any) {
    next(err);
  }
};
