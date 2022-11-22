import { RmqMatchHistoryGameInfo } from 'src/match-history/dto/match-info.dto';
import { UserProfile } from 'src/user/dto/user-info.dto';

const REFERENCE_SCORE = 20;
const CANVARS_WIDTH = 800;
const CANVARS_HEIGHT = 600;
const BALL_SPEED = 7;
const BAR_SIZE = 100;
const BAR_MOVE_SPEED = 5;

class Ball {
  constructor(speed: number) {
    this.x = CANVARS_WIDTH / 2;
    this.y = CANVARS_HEIGHT / 2;
    this.radius = 10;
    this.velocityX = 5;
    this.velocityY = 5;
    this.speed = speed;
    this.height = CANVARS_HEIGHT;
    this.width = CANVARS_WIDTH;
  }
  x: number;
  y: number;
  radius: number;
  velocityX: number;
  velocityY: number;
  speed: number;
  height: number;
  width: number;

  update(speed: number): void {
    this.speed = speed;
  }
  move(): void {
    this.x += this.velocityX;
    this.y += this.velocityY;
  }
  collidesTopBottom(): void {
    if (this.y - this.radius < 0 || this.y + this.radius > this.height) {
      this.velocityY *= -1;
    }
  }
  collidesBar(player: Player): void {
    let collidePoint = this.y - (player.y + player.height / 2);
    collidePoint /= player.height / 2;

    const angleRad = (Math.PI / 4) * collidePoint;

    const direction = this.x + this.radius < this.width / 2 ? 1 : -1;
    this.velocityX = direction * this.speed * Math.cos(angleRad);
    this.velocityY = this.speed * Math.sin(angleRad);
    this.speed += 0.1;
  }
  resetBall(speed): void {
    this.x = this.width / 2;
    this.y = this.height / 2;
    this.velocityX *= -1;
    this.speed = speed;
  }
}

class Player {
  constructor(left: boolean, barSize: number) {
    this.x = left === true ? 0 : CANVARS_WIDTH - 10;
    this.y = (CANVARS_HEIGHT - barSize) / 2;
    this.width = 10;
    this.height = barSize;
    this.score = 0;
    this.barUp = false;
    this.barDown = false;
  }
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
  barUp: boolean;
  barDown: boolean;

  update(barSize: number): void {
    this.height = barSize;
    this.y = (CANVARS_HEIGHT - barSize) / 2;
  }
}

export class Game {
  constructor(rank) {
    this.width = CANVARS_WIDTH;
    this.height = CANVARS_HEIGHT;
    this.isFinished = false;
    this.ball = new Ball(BALL_SPEED);
    this.lPlayer = new Player(true, BAR_SIZE);
    this.rPlayer = new Player(false, BAR_SIZE);
    this.lPlayerMmr = 0;
    this.rPlayerMmr = 0;
    this.isRank = rank;
    this.renderReady = false;
    this.isSaveData = false;
    this.saveDone = false;
  }
  game_id: string;
  ball: Ball;
  lPlayerId: string;
  rPlayerId: string;
  lPlayer: Player;
  rPlayer: Player;
  lPlayerMmr: number;
  rPlayerMmr: number;
  lPlayerInfo: UserProfile;
  rPlayerInfo: UserProfile;
  playerReady: string;
  renderReady: boolean;
  loser: string;
  isFinished: boolean;
  isSaveData: boolean;
  speed: number;
  difficulty: string;
  width: number;
  height: number;
  isRank: boolean;
  saveDone: boolean;

  public init(difficulty): void {
    if (difficulty === 1) {
      this.difficulty = 'easy';
      this.speed = 5;
      this.ball.update(5);
      this.lPlayer.update(120);
      this.rPlayer.update(120);
    } else if (difficulty === 2) {
      this.difficulty = 'normal';
      this.speed = 7;
      this.ball.update(7);
      this.lPlayer.update(100);
      this.rPlayer.update(100);
    } else {
      this.difficulty = 'hard';
      this.speed = 9;
      this.ball.update(9);
      this.lPlayer.update(80);
      this.rPlayer.update(80);
    }
  }
  public isCollision(player): boolean {
    const playerTop = player.y;
    const playerBottom = player.y + player.height;
    const playerLeft = player.x;
    const playerRight = player.x + player.width;

    const ballTop = this.ball.y - this.ball.radius;
    const ballBottom = this.ball.y + this.ball.radius;
    const ballLeft = this.ball.x - this.ball.radius;
    const ballRight = this.ball.x + this.ball.radius;

    return (
      playerLeft < ballRight &&
      playerTop < ballBottom &&
      playerRight > ballLeft &&
      playerBottom > ballTop
    );
  }
  public update(): void {
    if (this.lPlayer.score === 10) {
      this.loser = this.rPlayerInfo.user_id;
      this.isFinished = true;
    } else if (this.rPlayer.score === 10) {
      this.loser = this.lPlayerInfo.user_id;
      this.isFinished = true;
    }

    if (this.ball.x - this.ball.radius < 0) {
      this.rPlayer.score++;
      this.ball.resetBall(this.speed);
    } else if (this.ball.x + this.ball.radius > this.width) {
      this.lPlayer.score++;
      this.ball.resetBall(this.speed);
    }

    if (this.lPlayer.barUp === true) this.lPlayerBarUp();
    if (this.lPlayer.barDown === true) this.lPlayerBarDown();
    if (this.rPlayer.barUp === true) this.rPlayerBarUp();
    if (this.rPlayer.barDown === true) this.rPlayerBarDown();

    this.ball.move();
    this.ball.collidesTopBottom();

    // 테스트를 위한 simple AI
    // this.rPlayer.y +=
    //   (this.ball.y - (this.rPlayer.y + this.rPlayer.height / 2)) * 0.1;

    const player =
      this.ball.x + this.ball.radius < this.width / 2
        ? this.lPlayer
        : this.rPlayer;
    if (this.isCollision(player)) {
      this.ball.collidesBar(player);
    }
  }
  finishGame(): void {
    // 여기서 유저 정보의 점수의 차이에 따라 점수를 다르게 주면 될 듯
    if (this.lPlayerId === this.loser) {
      this.rPlayerMmr += REFERENCE_SCORE;
      this.lPlayerMmr -= REFERENCE_SCORE;
    } else {
      this.rPlayerMmr -= REFERENCE_SCORE;
      this.lPlayerMmr += REFERENCE_SCORE;
    }
  }
  public renderInfo(): object {
    return {
      width: this.width,
      height: this.height,
      playerHeight: this.lPlayer.height,
      playerWidth: this.lPlayer.width,
      ballRadius: this.ball.radius,
      lPlayerX: this.lPlayer.x,
      rPlayerX: this.rPlayer.x,
    };
  }
  public renderData(): object {
    return {
      lPlayerY: this.lPlayer.y,
      lPlayerScore: this.lPlayer.score,
      rPlayerY: this.rPlayer.y,
      rPlayerScore: this.rPlayer.score,
      ballX: this.ball.x,
      bally: this.ball.y,
    };
  }
  public lPlayerInput(key, input): void {
    if (key === 'up') {
      this.lPlayer.barUp = input;
    } else if (key === 'down') {
      this.lPlayer.barDown = input;
    }
  }
  public rPlayerInput(key, input): void {
    if (key === 'up') {
      this.rPlayer.barUp = input;
    } else if (key === 'down') {
      this.rPlayer.barDown = input;
    }
  }
  public lPlayerBarUp(): void {
    if (this.lPlayer.y !== (this.lPlayer.height / 2) * -1) {
      this.lPlayer.y -= BAR_MOVE_SPEED;
    }
  }
  public lPlayerBarDown(): void {
    if (this.lPlayer.y !== this.height - this.lPlayer.height / 2) {
      this.lPlayer.y += BAR_MOVE_SPEED;
    }
  }
  public rPlayerBarUp(): void {
    if (this.rPlayer.y !== (this.rPlayer.height / 2) * -1) {
      this.rPlayer.y -= BAR_MOVE_SPEED;
    }
  }
  public rPlayerBarDown(): void {
    if (this.rPlayer.y !== this.height - this.lPlayer.height / 2) {
      this.rPlayer.y += BAR_MOVE_SPEED;
    }
  }
  public gameInfo(): RmqMatchHistoryGameInfo {
    let mode: string;
    if (this.isRank === true) mode = 'rank';
    else mode = 'friendly';
    return {
      l_player_id: this.lPlayerInfo.user_id,
      r_player_id: this.rPlayerInfo.user_id,
      difficulty: this.difficulty,
      mode,
    };
  }
  public gameResult() {
    const winner_id: string =
      this.lPlayerInfo.user_id !== this.loser
        ? this.lPlayerInfo.user_id
        : this.rPlayerInfo.user_id;
    return {
      game_id: this.game_id,
      winner_id,
      l_player_score: this.lPlayer.score,
      r_player_score: this.rPlayer.score,
    };
  }
  public changeRankInfo() {
    return {
      l_player: {
        user_id: this.lPlayerInfo.user_id,
        game_id: this.game_id,
        delta: this.lPlayerMmr,
      },
      r_player: {
        user_id: this.rPlayerInfo.user_id,
        game_id: this.game_id,
        delta: this.rPlayerMmr,
      },
    };
  }
}
