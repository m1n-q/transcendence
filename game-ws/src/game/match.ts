import { Socket } from 'socket.io';

const DIFFERENCE_SCORE = 100;
const WAITING_TIME = 30;

export class MatchMaking {
  constructor() {
    this.matchingQueue = new Map();
  }
  //
  matchingQueue: Map<string, number>;

  leaveMatchingQueue(socketId) {
    this.matchingQueue.delete(socketId);
  }

  findUser(socketId, differenceScore, mmr): string {
    let matchingPlayerId = '';
    let min = differenceScore;
    this.matchingQueue.forEach((v, k) => {
      if (Math.abs(mmr - v) < min && k !== socketId) {
        min = Math.abs(mmr - v);
        matchingPlayerId = k;
      }
    });
    if (matchingPlayerId !== '') {
      this.matchingQueue.delete(matchingPlayerId);
      this.matchingQueue.delete(socketId);
      return matchingPlayerId;
    }
    return socketId;
  }

  matchMaking(clientSocket: Socket): string | object {
    const userInfo = clientSocket['user_info'];
    this.matchingQueue.set(clientSocket.id, userInfo.user.mmr);
    clientSocket['user_info'].waiting++;
    if (
      this.matchingQueue.size === 0 ||
      (this.matchingQueue.size === 1 &&
        this.matchingQueue.get(clientSocket.id) !== undefined)
    ) {
      return clientSocket.id;
    } else {
      // clientSocket['user_info'].waiting++;
      if (userInfo.waiting < WAITING_TIME) {
        return this.findUser(
          clientSocket.id,
          DIFFERENCE_SCORE,
          userInfo.user.mmr,
        );
      } else if (clientSocket['user_info'].waiting < WAITING_TIME * 2) {
        return this.findUser(
          clientSocket.id,
          DIFFERENCE_SCORE * 2,
          userInfo.user.mmr,
        );
      } else if (clientSocket['user_info'].waiting < WAITING_TIME * 3) {
        return this.findUser(
          clientSocket.id,
          DIFFERENCE_SCORE * 4,
          userInfo.user.mmr,
        );
      } else if (clientSocket['user_info'].waiting < WAITING_TIME * 4) {
        return this.findUser(
          clientSocket.id,
          DIFFERENCE_SCORE * 8,
          userInfo.user.mmr,
        );
      } else if (clientSocket['user_info'].waiting < WAITING_TIME * 5) {
        return this.findUser(
          clientSocket.id,
          DIFFERENCE_SCORE * 16,
          userInfo.user.mmr,
        );
      } else {
        return this.findUser(
          clientSocket.id,
          DIFFERENCE_SCORE * 50,
          userInfo.user.mmr,
        );
      }
    }
  }
}
