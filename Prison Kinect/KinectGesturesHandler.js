#pragma strict
/* Handlers of Kinect Gestures. 
  Note that this script must be in the same object that KinectGesturesDetector.js. 
  Don't worry if you use KinectEngageUsers.js, it will be create them automatically
  It's similar to KeyPlayer.js (inspirated from there), because the input activates the same actions of the game.
  The inputs detector is KinectGesturesDetector and the handler of these actions is this script.
  All the handlers are called from KinectGesturesDetector.js
*/
	
	
private var s_PlayerBall : PlayerBallController; //scripts
private var s_PlayerMove: PlayerMoveController;
private var s_BallControl : BallControl;

private var playerCamera : GameObject; //XXX: maybe quit center camera in Kinect Player

var timeMove = 0.5;

function Awake() {
	s_BallControl = GameObject.FindGameObjectWithTag("Ball").GetComponent(BallControl);
}
	

function SetPlayer(player: GameObject) { //update the user to handle gestures
	s_PlayerBall = player.GetComponent(PlayerBallController);
	s_PlayerMove = player.GetComponent(PlayerMoveController);
}


function SetGamer(gamer: int) { //set the number of the gamer (1 or 2). it will be called only at the beginning
	if (gamer == 1)
		playerCamera = GameObject.Find("/Camera1");
	else
		playerCamera = GameObject.Find("/Camera2");
}

function Handler_Move(direction : Vector2) {  //Handler to move player along its area. (v : float, h : float
	print("HANDLER of Move. direction = " + direction);
	var time = 0.0;
	while (time < timeMove) {
		time += Time.deltaTime;
		//s_PlayerMove.UpdateMove(direction.x, direction.y, false, false, true); //TODO: maybe run
		s_PlayerMove.SimpleMove(Vector3(direction.x, 0, direction.y));
		yield;
	}
	
	//s_PlayerMove.UpdateSimpleMove(Vector3(direction.x, 0, direction.y));
	//yield;
	//s_PlayerMove.IRotateToDefault();
	//playerCamera.SendMessage("Center");
	yield;
}

function Handler_CatchBall() { //TODO: called from two different gestures: catch from ground and catch from air
	print("HANDLER of CatchBall");
	GameObject.FindGameObjectWithTag("PrisonRules").GetComponent(PrisonHUD).OnTurnChanged(1); //test
	if ((!s_PlayerBall.HasBall()) && (!s_BallControl.IsCaught())) //if hasn't the ball and nobody has the ball, try catch it
		s_PlayerBall.TryCatchBall();
}

function Handler_ThrowBall(direction: Vector3, power: float) { //Handler when trig the gesture of throw. the power is in the range [0..1], it will be converted to [min, max] in BallPlayer
	print("HANDLER of ThrowBall: direction = " + direction + ", power = " + power);
	//TODO: direction. maybe define direction in BallPlayer or KinectGesturesDetector
	if (s_PlayerBall.HasBall()) //if player has ball. TODO: tener claro donde check hasBall
		s_PlayerBall.TryThrowBall(direction, power);
}
	
function Handler_Pass(power: float) { //the power is in the range [0..1], it will be converted to [min, max] in BallPlayer
	print("HANDLER of Pass (pass ball or change player)");
	
	if (!s_PlayerBall.HasBall())
		s_PlayerBall.ChangePlayer(power); //without ball, auto switch control to other player. XXX: if (fifa)
	else			
		s_PlayerBall.TryPassBall(power); //throw ball with the direction to aimed player, but an opponent could catch it before
}

function Handler_CenterCamera() { //also called from PlayerSwitchControl.js
	playerCamera.SendMessage("Center");
}

