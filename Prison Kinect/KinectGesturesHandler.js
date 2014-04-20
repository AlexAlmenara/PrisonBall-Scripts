#pragma strict
/* Handlers of Kinect Gestures. 
  Note that this script must be in the same object that KinectGesturesDetector.js. 
  Don't worry if you use KinectEngageUsers.js, it will be create them automatically
  The behaviour is inspirated from PlayerController.js */
	
	
private var s_BallPlayer : BallPlayer; //scripts
private var s_BallControl : BallControl;

function Awake() {
	s_BallControl = GameObject.FindGameObjectWithTag("Ball").GetComponent(BallControl);
}
	
/* //from MenuController.cs
void PushDetector_Push(){ 
	clicked = false;
    Debug.Log("PushDetector Push");
}*/

function SetPlayer(player: GameObject) { //update the user to handle gestures
	s_BallPlayer = player.GetComponent(BallPlayer);
}


function Handler_Move(v : float, h : float) { //Handler to move player along its area
	print("HANDLER of Move");
	//TODO: move player here
}

function Handler_CatchBall() { //called with two different gestures: catch from ground and catch from air
	print("HANDLER of CatchBall");
	if ((!s_BallPlayer.HasBall()) && (!s_BallControl.IsCaught())) //if hasn't the ball and nobody has the ball, try catch it
		s_BallPlayer.TryCatchBall();
}

function Handler_ThrowBall(power: float) { //Handler when trig the gesture of throw
	print("HANDLER of ThrowBall");
	//TODO: direction. maybe define direction in BallPlayer or KinectGesturesDetector
	if (s_BallPlayer.HasBall()) //if player has ball
		s_BallPlayer.TryThrowBall(power);
}
	
function Handler_Pass(power: float) {
	print("HANDLER of Pass (pass ball or change player)");
	
	if (!s_BallPlayer.HasBall())
		s_BallPlayer.ChangePlayer(power); //without ball, auto switch control to other player. XXX: if (fifa)
	else			
		s_BallPlayer.TryPassBall(power); //throw ball with the direction to aimed player, but an opponent could catch it before
}