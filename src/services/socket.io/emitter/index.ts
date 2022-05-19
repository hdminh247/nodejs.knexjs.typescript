import _ from "underscore";

import SocketIOHelper from "../helper";
import HttpResponse from "../../response";

// const socketIOTitle = '[Socket.io]';

export default class SocketIOEmitter {
  private socketHelper: SocketIOHelper;

  constructor() {
    this.socketHelper = new SocketIOHelper();
  }

  // Emit event to to user Id Arr
  public async emitEventToUserIdArr(
    userIdArr: string[],
    eventName: string,
    data: any,
    socket: any,
  ): Promise<CustomResponse> {
    // Get connected client list
    const clientList = this.socketHelper.getConnectedClientListByUserIdArr(
      this.socketHelper.getClientList(socket),
      userIdArr,
    );

    // Emit event to them
    return await this.emitToClients(clientList, eventName, data);
  }

  // Emit event to to room Id Arr
  public async emitEventToRoomIdArr(
    roomArr: string[],
    eventName: string,
    data: any,
    socket: any,
  ): Promise<CustomResponse> {
    // Emit event to them

    return await this.emitToRooms(this.socketHelper.getSocketIOInstance(socket), roomArr, eventName, data);
  }

  // Emit event to to all connected users
  public async emitEventToAllConnectedUser(eventName: string, data: any, socket: any): Promise<CustomResponse> {
    const io = this.socketHelper.getSocketIOInstance(socket);

    return io.emit(eventName, data);
  }

  private async emitToClients(
    clientList: Record<string, any>[],
    eventName: string,
    data: any,
  ): Promise<CustomResponse> {
    try {
      // Emit event for each client
      _.each(clientList, (client) => {
        client.socket.emit(eventName, data);
        //console.debug(`${socketIOTitle} Emit event ${eventName} on user ${client.id}`);
      });

      // Return success
      return HttpResponse.returnSuccess();
    } catch (err: any) {
      // Return error
      return HttpResponse.returnErrorWithMessage(err.message);
    }
  }

  private async emitToRooms(io: any, roomArr: string[], eventName: string, data: any): Promise<CustomResponse> {
    try {
      // Emit event for each room
      _.each(roomArr, (room) => {
        io.sockets.in(room).emit(eventName, data);
      });

      // Return success
      return HttpResponse.returnSuccess();
    } catch (err: any) {
      // Return error
      return HttpResponse.returnErrorWithMessage(err.message);
    }
  }
}
