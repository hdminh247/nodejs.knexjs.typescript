import _ from "underscore";

import HttpResponse from "../../response";
import CustomResponse from "../../response/customResponse";

const socketIOTitle = "[Socket.io]";

export default class SocketIOHelper {
  // Add an socket to list
  public async addSocket(
    socketClientList: Record<string, any>,
    userInfo: Record<string, any>,
    socket: any,
  ): Promise<CustomResponse> {
    let isUpdate = false;
    let result = new CustomResponse();

    try {
      if (_.isObject(socketClientList) && _.isObject(userInfo) && _.isObject(socket)) {
        // Add this socket to user info
        Object.assign(userInfo, { socket });

        // Check if this socket is already existed
        if (socketClientList[userInfo.ddqcUserKey]) {
          // Marked this is update action
          isUpdate = true;

          // Replace old socket by the new one at index
          result = await this.updateSocketById(socketClientList, userInfo.ddqcUserKey, userInfo);
        } else {
          // Store the new socket
          socketClientList[userInfo.ddqcUserKey] = userInfo;
        }
      } else {
        // Invalid params
        result = HttpResponse.returnErrorWithMessage("Invalid parameters: [userInfo, socket] must be object");
      }

      // All success, write log
      if (!result.error) {
        console.debug(
          `${socketIOTitle} ${isUpdate ? "Updated" : "Added"} socket with id ${socket.id} of user ${
            userInfo["email"]
          } (${userInfo["ddqcUserKey"]})`,
        );
      }

      return result;
    } catch (err: any) {
      return HttpResponse.returnErrorWithMessage(err.message);
    }
  }

  // Replace a old socket by the new one by Id
  private async updateSocketById(socketClientList: any, id: number, newSocket: any): Promise<CustomResponse> {
    socketClientList[id] = newSocket;

    // Return success
    return HttpResponse.returnSuccess();
  }

  // Remove socket by Id
  public removeSocketFromList(socketClientList: Record<string, any>, socket: Record<string, any>): string {
    let id = null;

    if (
      !socket.handshake.query.ignoreAuth ||
      (socket.handshake.query.ignoreAuth && socket.handshake.query.ignoreAuth.toString() !== "true")
    ) {
      id = socket.handshake.query.userInfo.ddqcUserKey;

      // If this socket connection is running
      if (socketClientList[id]) {
        // Close this socket
        this.closeSocket(socket);

        // Remove this socket from list
        delete socketClientList[id];

        // Log
        console.debug(`${socketIOTitle} Removed socket with id ${socket.id}`);
      }
    } else {
      id = socket.handshake.query.identity;

      // If this socket connection is running
      if (socketClientList[`${id}-noauth`]) {
        // Close this socket
        this.closeSocket(socket);

        // Remove this socket from list
        delete socketClientList[`${id}-noauth`];

        // Log
        console.debug(`${socketIOTitle} Removed socket with id ${socket.id}`);
      }
    }

    return id;
  }

  // Close socket connection
  public closeSocket(socket: any): void {
    socket.disconnect(true);
  }

  // Get connected client info by their ids
  public getConnectedClientListByUserIdArr(socketClientList: any, userIdArr: string[]): Record<string, any>[] {
    const clientList: any[] = [];

    _.each(userIdArr, function (userId) {
      // Get desired available connect client
      if (userId && socketClientList[userId.toString()]) {
        clientList.push(socketClientList[userId]);
      }
    });

    return clientList;
  }

  // Leave specific room by user ids
  public leaveRoomByUserIdArr(userIdArr: string[], roomId: string, socket: any) {
    _.each(userIdArr, (userId) => {
      if (socket.clientList[<string>userId]) {
        // Leave socket room
        socket.clientList[<string>userId].socket.leave(roomId, () => {
          console.debug(
            `${socketIOTitle} Client ${userId} with socket Id: ${socket.clientList[userId].socket.id} has just left room ${roomId}`,
          );
        });
      }
    });
  }

  public getClientList(socket: any): Record<string, any>[] {
    return socket.clientList;
  }

  public getSocketIOInstance(socket: any): any {
    return socket.io;
  }
}
