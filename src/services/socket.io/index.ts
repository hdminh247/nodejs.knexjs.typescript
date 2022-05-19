// Libraries
import { Server } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import _ from "underscore";
import JWT from "jsonwebtoken";

// Utils
import SocketIOHelper from "./helper";
import SocketIOEmitter from "./emitter";
import User from "../../models/user";

const socketIOTitle = "[Socket.io]";

interface QueryInterface {
  ignoreAuth: string;
  userInfo: Record<string, any>;
  identity: string;
  token?: string;
}

export default class SocketIO {
  private clientList: Record<string, any> = {};
  private socketHelper: SocketIOHelper;
  private socketEmitter: SocketIOEmitter;
  private io: SocketServer | undefined;

  constructor() {
    this.socketHelper = new SocketIOHelper();
    this.socketEmitter = new SocketIOEmitter();
  }

  public run(server: Server): void {
    // Start socket
    this.io = new SocketServer(server, {
      allowEIO3: true,
      pingTimeout: 10000, // How many ms without a pong packet to consider the connection closed,
      cors: {
        origin: true,
        credentials: true,
      },
    });

    console.info(`${socketIOTitle} Listening new connection...`);

    // Middleware to verify token
    this.io
      .use((socket: Socket, next) => {
        // Ignore auth
        const socketQuery = socket.handshake.query as unknown as QueryInterface;
        // const token = (socket.handshake.auth as AuthInterface).token;
        const token = socketQuery["token"];

        if (socketQuery && socketQuery.ignoreAuth && socketQuery.ignoreAuth.toString() === "true") {
          console.log("Ignore auth node");
          next();
          // Do something here
        } else {
          if (socketQuery && token) {
            JWT.verify(token, process.env.APP_SECRET as string, async (err, decoded: any) => {
              if (err) {
                // Return more clear message if jwt token is expired
                if (err.message === "Jwt is expired") {
                  // @ts-ignore
                  const expireTime = new Date(err.expiredAt * 1000);
                  next(new Error("Your token expired at " + expireTime));
                } else {
                  // Other error
                  next(new Error(err.message));
                }
              } else {
                // Invalid token
                if (!decoded) {
                  next(new Error("Invalid"));
                } else {
                  // Get user info
                  const user = await User.query().findOne({ ddqcUserKey: decoded.ddqcUserKey });

                  // Token doest not belong to this account
                  if (!user) {
                    next(new Error("Authentication error"));
                  }

                  socketQuery.userInfo = user;
                  next();
                }
              }
            });
          } else {
            console.log(`Err`);
            console.log(socket.handshake);
            next(new Error("Authentication error"));
          }
        }
      })

      // Client connect listener
      .on("connection", async (client: Socket) => {
        console.debug(`${socketIOTitle} Client connected: SocketID = ${client.id}`);

        const query = client.handshake.query as unknown as QueryInterface;

        // Get language from client
        // const lang = client.handshake.query.lang;

        // Add to socket client list
        const rs = await this.socketHelper.addSocket(this.clientList, query.userInfo, client);

        // Close this socket due to error
        if (rs.error) {
          client.disconnect();
          console.debug(`${socketIOTitle} Disconnect client with SocketID = ${client.id} due to ${rs.errors} `);
        }

        client.on("join-room", async (receiveData, cb) => {
          const { sessionId, runningId } = receiveData;
          this.joinRoomById(query.userInfo.ddqcUserKey, `${sessionId}-${runningId}`);
          cb(true);
          try {
          } catch (e) {
            cb(false);
          }
        });

        client.on("leave-room", async (receiveData, cb) => {
          const { sessionId, runningId } = receiveData;
          this.leaveRoomById(query.userInfo.ddqcUserKey, `${sessionId}-${runningId}`);
          cb(true);
          try {
          } catch (e) {
            cb(false);
          }
        });

        // Client disconnect listener
        client.on("disconnect", async () => {
          // Remove socket from list
          this.socketHelper.removeSocketFromList(this.clientList, client);

          console.debug(`${socketIOTitle} Client disconnected: SocketID = ${client.id} `);
        });
      });
  }

  /*///////////////////////////////////////////////////////////////
    /////                   START BASIC METHOD                 /////
    ///////////////////////////////////////////////////////////////*/

  // Send event to multi rooms
  public sendNewEventToRooms(roomIdArr: string[], eventName: string, data: any) {
    this.socketEmitter.emitEventToRoomIdArr(roomIdArr, eventName, data, this);
  }

  // Join a room
  private joinRoomById(userId: string, roomId: string): void {
    if (this.clientList[userId]) {
      // Get socket instance by user Id
      const { socket } = this.clientList[userId];

      // If this socket connection is opening
      if (socket) {
        socket.join(roomId, () => {
          console.info(
            `${socketIOTitle} Client ${userId} with socket Id: ${socket.id} has just joined room ${roomId} `,
          );
        });
      }
    } else {
      console.log(`User ${userId} is not stored in socket client list`);
    }
  }

  // Leave a room
  protected leaveRoomById(userId: string, roomId: string): void {
    if (this.clientList[userId]) {
      // Get socket instance by user Id
      const { socket } = this.clientList[userId];

      socket.leave(roomId, () => {
        console.debug(`${socketIOTitle} Client ${userId} with socket Id: ${socket.id} has just left room ${roomId} `);
      });
    }
  }

  // Check if specific use connected to socket or not
  protected isConnected(userId: string): boolean {
    return !_.isEmpty(this.clientList[userId]);
  }

  // Close socket by user Id
  protected closeSocketByUserId(userId: string): void {
    if (this.clientList[userId]) {
      this.socketHelper.closeSocket(this.clientList[userId].socket);
    }
  }

  /*///////////////////////////////////////////////////////////////
    /////                     END BASIC METHOD                  /////
    ///////////////////////////////////////////////////////////////*/
}
