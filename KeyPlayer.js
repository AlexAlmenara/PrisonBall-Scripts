#pragma strict

//this script must be disabled at the beginning
var maxKeyPower = 800; 
var minKeyPower = 150;

private var keyThrowPower = 0.0;
var stepPower = 1000;

//neccesaries scripts and objects 
private var s_PlayerMove: PlayerMoveController; 
private var s_PlayerBall: PlayerBallController;
private var s_BallControl : BallControl;
private var playerCamera : GameObject; //we need the camera here for send it the message Center() (center camera)
//private var ball : GameObject;
private var hand: Transform;
//private var firstHandPosition : Vector3;
var shoulder : Transform;
var initialShoulderRotation : Quaternion;


//keys:
private var key_horizontal : String; 
private var key_vertical : String; 
private var key_fire : String; 
private var key_run : String; 
private var key_jump : String; 
private var key_aimH : String; 
private var key_aimV : String; 
private var key_center : String; 
private var key_pass : String;


//aim Ball
//var raiseBall = 2;
var aimVMax = 0.5; //limites de apuntar con pelota
var aimHMax = 0.5;
var aimStep = 0.01; //step para apuntar con pelota

private var aimV = 0.0; //current offset of ball for aim
private var aimH = 0.0;

var autoSpeed = 2.0; //speed when the character moves automatically

private var debug = false; //TODO: quit this

function Start() { //TODO: maybe a passive start or Awake or Start
	//yield WaitForSeconds(0.2); //wait for start of PlayerBallController
	s_PlayerMove = gameObject.GetComponent(PlayerMoveController);
	s_PlayerBall = gameObject.GetComponent(PlayerBallController);
	var ball = GameObject.FindGameObjectWithTag("Ball"); //TODO
	s_BallControl = ball.GetComponent(BallControl);
	
	//SetKeyGamer1();
	//CopyFromController();
}


/*function OnEnable() {
	print("key on enabled");
	CopyFromController(); //note: no need to call this in Start() because this script must be disabled at the beginning
}*/

function CopyFromController() { //copies the necessary data from PlayerBallController and PlayerMoveController
	//hand = s_PlayerBall.hand;
	//firstHandPosition = s_PlayerBall.firstHandPosition;
	shoulder = s_PlayerBall.shoulder;
	initialShoulderRotation = s_PlayerBall.initialShoulderRotation;
}

//*********
function SetKeyGamer1() {
	key_horizontal = "Horizontal";
	key_vertical = "Vertical";
	key_fire = "Fire";
	key_run = "Run";
	key_jump = "Jump"; 
	key_aimH = "AimH"; 
	key_aimV = "AimV"; 
	key_center = "Center";
	key_pass = "Pass";
	
	yield;
	playerCamera = GameObject.Find("/Camera1");
	s_PlayerMove.SetForwardTransform(playerCamera.transform); //note that when PlayerBallController enables this script, it calls SetKeyGamerX()
	//playerCamera.SendMessage("SetKeyCenter", key_center); //note that in PrisonRules.js is called camera.SetTarget()
}


function SetKeyGamer2() {
	key_horizontal = "Horizontal2";
	key_vertical = "Vertical2";
	key_fire = "Fire2";
	key_run = "Run2";
	key_jump = "Jump2"; 
	key_aimH = "AimH2"; 
	key_aimV = "AimV2"; 
	key_center = "Center2";
	key_pass = "Pass2";
	
	yield;
	playerCamera = GameObject.Find("/Camera2");
	s_PlayerMove.SetForwardTransform(playerCamera.transform);
}


/* Smoothly auto rotate without key control, center camera and reset move variables.
   We need call move.Reset() because without it the player will rotate uncorrectly to his pass rotation when he was controlled.
   to avoid this, Reset() will set the new rotation as valid
   There's no problem to walk or run, so we don't need an AutoMove() function. s_PlayerMove.MoveTo() takes this functionality 
   
   Version 2: this function is not used. now is equivalent to call s_PlayerMove.RotateTo() (inside is calling Reset)
function AutoRotate(rotation: Quaternion, speed: float) {
	SendMessage("SetControllable", false);
	yield;
	yield s_PlayerMove.RotateTo(rotation, speed); //step rotation with speed. //transform.rotation = rotation; transform.Rotate(0, 50, 0);
	playerCamera.SendMessage("Center");
	yield WaitForSeconds(1);
	s_PlayerMove.Reset(); //inside: SendMessage("SetControllable", true);
}*/


function CenterCamera() {
	playerCamera.SendMessage("Center");
}

//si tiene la pelota, antes de tirar puede apuntar moviendo las teclas w, a, s, d
function AimBall(v: float, h: float) { //v and h are the current offsets to be added to aimV and aimH respectively (in a scale of aimStep)
	
	//var pos = transform.TransformPoint(ballPosition);	//sigue manteniendo la pelota vaya por donde vaya
	
	if ( ((v < 0) && (aimV > -aimVMax)) || ((v > 0) && (aimV < aimVMax)) )  //si esta dentro del rango
		aimV += v * aimStep;
			
	if ( ((h < 0) && (aimH > -aimHMax)) || ((h > 0) && (aimH < aimHMax)) )  //si esta dentro del rango
		aimH += h * aimStep;
			
	//TODO: mover brazo segun posicion camara, v y h, pelota sigue al brazo
	//var forward = playerCamera.transform.TransformPoint(Vector3.forward);
	//hand.position = gameObject.transform.TransformPoint(firstHandPosition + Vector3(aimH, aimV, 0)); //position relative to player. TODO: change axis of camera
	//shoulder.Rotate(aimH, aimV, 0);

	//ball.transform.position = Vector3(pos.x + x , raiseBall + y, pos.z);	
	//ball.transform.position = Vector3(pos.x + aimH , raiseBall + aimV, pos.z);
	//ball.transform.rotation.y = gameObject.transform.rotation.y; //rota con el personaje. solo sirve para que oponentes roten tambien
	yield;
}


function PlayerBall() {	
	//if (!s_PlayerBall.IsBusy() && Input.GetButtonUp(key_fire) /*&& controller.IsGroundedWithTimeout()*/ && !IsMoving()) { //once free the key: catch or throw
	//if (!s_PlayerBall.IsBusy()) { //&& !s_PlayerMove.IsMoving()) {
	
		if (Input.GetButton(key_fire) || Input.GetButton(key_pass)) //time pressing the key increments the power of thrown
			keyThrowPower += Time.deltaTime * stepPower;
			
		if (Input.GetButtonUp(key_fire)) { //Catch or throw ball
			if ((!s_PlayerBall.HasBall()) && (!s_BallControl.IsCaught())) //if hasn't the ball and nobody has the ball, try catch it
				gameObject.SendMessage("TryCatchBall");
			else {
				keyThrowPower = Mathf.InverseLerp(minKeyPower, maxKeyPower, keyThrowPower); //converts to range [0..1]
				//si pulsa tecla Fire1, intenta tirar pelota
				//if(!s_PlayerBall.IsBusy() && Input.GetButtonDown("Fire2") && !IsMoving()) //puede hacer movimiento de tirar sin pelota
				s_PlayerBall.TryThrowBall(Vector3(aimH, aimV, 0), keyThrowPower); //TODO: direction
			}
			
			//print("input power = " + keyThrowPower); 
			keyThrowPower = 0.0;
		}
		
		else { //Switch or pass ball to other player
			if (Input.GetButtonUp(key_pass)) {
				keyThrowPower = Mathf.InverseLerp(minKeyPower, maxKeyPower, keyThrowPower); //converts to range [0..1]
				//print("key_pass of player " + s_PlayerBall.GetName());
				if (!s_PlayerBall.HasBall())
					gameObject.SendMessage("ChangePlayer", keyThrowPower); //without ball, auto switch control to other player. XXX: if (fifa)
				else			
					gameObject.SendMessage("TryPassBall", keyThrowPower); //throw ball with the direction to aimed player, but an opponent could catch it before
				
				keyThrowPower = 0.0;
			}
		}
		
		if (s_PlayerBall.HasBall()) {
			//var pos = transform.TransformPoint(punchPosition);	//sigue manteniendo la pelota vaya por donde vaya
			//ball.transform.position = Vector3(pos.x, raiseBall, pos.z);	
			//ball.transform.rotation.y = this.transform.rotation.y; //rota con el personaje. solo sirve para que oponentes roten tambien
			var v = Input.GetAxisRaw(key_aimV); //("AimVertical");
			var h = Input.GetAxisRaw(key_aimH); //("AimHorizontal");
			
			AimBall(v, h); //apuntar con la pelota. XXX: maybe quit this function, only follow hand
		}
		
	//} //if !busy
}

function Update() {
	//shoulder.Rotate(Vector3.up * Time.deltaTime);

	if (!s_PlayerMove.IsControllable()) {
		//print("no controllableee");
		Input.ResetInputAxes(); // kill all inputs if not controllable.
	}
	else {
		//print("key lee teclas");
		
		if (Input.GetButtonDown(key_jump)) {
			keyThrowPower = 0.0;
			s_PlayerMove.StartJump(); //lastJumpButtonTime = Time.time;
		}
		else
			if (Input.GetButton(key_center) && !s_PlayerMove.IsMoving())
				playerCamera.SendMessage("Center");
			else
				PlayerBall(); //XXX: maybe independent of jump and center
			
			
		var v = Input.GetAxisRaw(key_vertical);
		var h = Input.GetAxisRaw(key_horizontal);
		var run = Input.GetButton(key_run);
		var jump = Input.GetButton(key_jump);
		
		//if (debug) //TODO: quit //print("v = " + v + ", h = " + h);
		s_PlayerMove.UpdateMove(v, h, run, jump, true);
	}
}


function SetDebug(state: boolean) { //TODO: quit this
	debug = state;
}

/*function OnControllerColliderHit (hit : ControllerColliderHit )
{
//	Debug.DrawRay(hit.point, hit.normal);
	if (hit.moveDirection.y > 0.01) 
		return;
	wallJumpContactNormal = hit.normal;
}*/



function Reset() {
	SetKeyGamer1();
}


@script RequireComponent(PlayerBallController)
@script RequireComponent(PlayerMoveController)

@script AddComponentMenu("Third Person Player/Key Player")
