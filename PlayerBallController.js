#pragma strict 

/*
 This script:
 - defines player's variables relationed to PrisonBall, as playerID, team.
 - lets him manipulate the ball.

 - sounds
 
inspirated in ThirdPersonCharacterAttack.js

pasos: no tiene pelota, coge pelota, apunta, tira pelota

*/


static var NOPLAYER = -1;
/*XXX: private*/ var playerID: int = NOPLAYER; //identificador de jugador en la cancha
var playerName = "player"; //name of the player //var playerID in PrisonRules.js
var team = 1; //team of player: 1 or 2


var waitTime = 0.2;
var throwTime = 0.4;
var handPosition = new Vector3 (0, 0, 0.8); //position to catch the ball, only forwards. relative to player
var handBallPosition : Vector3; //position of caught ball: relative to hand
var catchRadius = 1.3; //radius to catch ball

var throwSound : AudioClip;


//throw ball with power between [150, 800] with a direction.y = 1. good values: power=350, y=1. don't need to change y
var maxPower = 800; 
var minPower = 150;
var strongPower = 400; //threshold of power indicating that power is enough to another special situation: pass ball to player in other area, throw ball losing direction, bonus hit...

//var powerLoseDirection = 1100; //if player throw very strong, he will lose direction from this value. if this value is high, the player will be better
var basePower = 70; //this will be added with the power of input. this base determinates the strength of the player
var baseDirection = Vector3(0, 1, 0); //y = para tirar un poco arriba: tiro parabolico. x, z: direccion

private var busy = false;

private var ball : GameObject;
private var hasBall = false; //tiene pelota
//private var touched = false; //tocado por pelota
private var hasProtection = false; //protection against burning. false: can be burned. true: can't be burned

private var collisionFlags : CollisionFlags; // The last collision flags returned from controller.Move

private var s_PrisonRules : PrisonRules;

var leftHanded = false; //if player is left-handed
var shoulder : Transform;
var initialShoulderRotation : Quaternion;
var hand: Transform;
private var jointsOk = false;
//var firstHandPosition : Vector3;


function Awake() {
	ball = GameObject.FindGameObjectWithTag("Ball");
	s_PrisonRules = GameObject.FindGameObjectWithTag("PrisonRules").GetComponent(PrisonRules);
	
	//UpdateShoulder(); //better call this in SetPlayerID
}

function UpdateShoulder() {
	//if (shoulder != null) //gameObject.SendMessage("RemoveAnimationTransform", shoulder);
	jointsOk = true;
	
	if (gameObject.name.Equals("LerpzPlayer(Clone)"+playerID)) {
	
		if (leftHanded) {
			shoulder = gameObject.transform.Find("rootJoint/torso/shoulders/shoulderLeft");
			hand = gameObject.transform.Find("rootJoint/torso/shoulders/shoulderLeft/elbowLeft/wristLeft/handLeft");
		}
		else {
			shoulder = gameObject.transform.Find("rootJoint/torso/shoulders/shoulderRight");
			hand = gameObject.transform.Find("rootJoint/torso/shoulders/shoulderRight/elbowRight/wristRight/handRight");
		}
		
		handBallPosition = Vector3(-0.3, -0.3, -0.1);
	}
	else if (gameObject.name.Equals("CarlPlayer(Clone)"+playerID)) {
		if (leftHanded) {
			shoulder = gameObject.transform.Find("Carl/Hips/Spine/Spine1/Spine2/LeftShoulder");
			hand = gameObject.transform.Find("Carl/Hips/Spine/Spine1/Spine2/LeftShoulder/LeftArm/LeftForeArm/LeftHand");
		}
		else {
			shoulder = gameObject.transform.Find("Carl/Hips/Spine/Spine1/Spine2/RightShoulder");
			hand = gameObject.transform.Find("Carl/Hips/Spine/Spine1/Spine2/RightShoulder/RightArm/RightForeArm/RightHand");
		}
		
		handBallPosition = Vector3(0.1, 0, 0.25);
	}
	else
		jointsOk = false;
	
	if (jointsOk) {
		//firstHandPosition = gameObject.transform.InverseTransformPoint(hand.position); //local position: relative to player
		initialShoulderRotation = shoulder.rotation; //gameObject.SendMessage("AddAnimationTransform", shoulder);
	}
}

function SetName(name: String) {
	playerName = name;
}

function GetName() {
	return playerName;
}

function SetTeam(team: int) {
	this.team = team;
} 

function HasBall() { //devuelve si tiene pelota
	return hasBall;
}


function GetPlayerID() {
	return playerID;
}

function SetPlayerID(id: int) { //set the ID of player. also update the object's name and the shoulder for throw the ball.
 	playerID = id;
	
	gameObject.name += id;
	UpdateShoulder();
}

function SetProtection(state: boolean) {
	hasProtection = state;
}

function GetProtection() {
	return hasProtection;
}

function IsBusy() {
	return busy;
}

function SetLeftHanded(state : boolean) {
	leftHanded = state;
	UpdateShoulder();
}

//we have the direction we want, but if the power is so high, we'll lose direction, return the new worse direction
/*function LoseAim(direction: Vector3, power: float) { //it's guarantied that this power is in the allowed range
	if (power < powerLoseDirection)
		return direction; //no lose direction

	var y = (maxPower - power) / 100;
	print("Lose direction + y = " + y);
	return direction + Vector3.up * y;
}*/

function QuitBall() { // to not have the ball, but the ball remains caught without physics. useful to pass to another player
	//print("Quit ball to player " + playerID);
	busy = true;
	//hand.position = gameObject.transform.TransformPoint(firstHandPosition);
	//shoulder.rotation = initialShoulderRotation;
	hasBall = false;
	yield WaitForSeconds(2);
	Physics.IgnoreCollision(gameObject.collider, ball.collider, false); //reactivate the collisions between this player and the ball
	//gameObject.SendMessage("RemoveAnimationTransform", shoulder); //gameObject.SendMessage("AddAnimationTransform", shoulder);

	busy = false;
}

function LeaveBall() { //quit the ball and return the physics of ball
	QuitBall();
	ball.SendMessage("SetCaught", false);
}


//NOTE that CatchBall() and Try_CatchBall() NO checks: !ball.isCaught and !player.hasBall. this is checked in PlayerController.js, IAPlayerControllr.js and PrisonRules.js

function CatchBall() : void { //auto catch ball. be careful outside to check no other player has the ball
	busy = true;
	ball.SendMessage("SetCaught", true); //also grounded = false, SetPhysics(false) inside
	hasBall = true;
	Physics.IgnoreCollision(gameObject.collider, ball.collider); //if Caught: no collisions between this player and the ball. this lets the player to move freely
	//gameObject.SendMessage("AddAnimationTransform", shoulder); //gameObject.SendMessage("RemoveAnimationTransform", shoulder);
		
	//in Update(), AimBall() : ball.transform.position = Vector3(pos.x, raiseBall, pos.z);	

	//in OnBallCaught() of PrisonRules.js: SetController(...)	
	s_PrisonRules.OnBallCaught(playerID); //avisa que alguien cogio pelota, para reiniciar que nadie sea tocado ahi. -> setController. /* XXX yield*/ 
	SendMessage("Center"); //center camera. to PlayerSwitchControl.js 
	busy = false;
}

//si la pelota esta a una cierta distancia del jugador, la coge.
function TryCatchBall() {
	busy = true;
	yield WaitForSeconds(waitTime);
	//print("PlayerTry_catch ball");
	var pos = transform.TransformPoint(handPosition); //TODO: decide variables
	if (Vector3.Distance(ball.transform.position, pos) < catchRadius) { //si pelota esta cerca de radio de accion
		//print("TryCatchBall: player " + playerID + " has caught the ball!!!");	
		CatchBall();
	}
	
	busy = false;
}


function ThrowBall(power: float, direction : Vector3) { //just throw ball without wait and check. the power is already in the range [minPower, maxPower]
	//print("va a tirar la pelotaa");
	if (throwSound)
		audio.PlayOneShot(throwSound);
	
	LeaveBall();	
	yield; //added to avoid catch ball itself
	//ball.SendMessage("SetCaught", false);
	//Physics.IgnoreCollision(gameObject.collider, ball.collider, false); //reactivate the collisions between this player and the ball
	s_PrisonRules.OnBallThrown(playerID); //send event that this player has thrown the ball /*XXX yield*/
	ball.GetComponent(BallControl).ThrowToDirection(power, direction); //XXX: efficiency. ball.SendMessage("Throw", throwPower, throwDirection);
	//LeaveBall(); //TODO
	//hasBall = false;
}


//si el jugador tiene la pelota, la tira con fuerza y direccion
/*function TryThrowBall(inputPower: float) { //TODO: add direction parameter
	
	busy = true;
	//print("player Try ThrowBall");
	//if (control != KINECT_PLAYER)
		//animation.CrossFadeQueued("punch", 0.1, QueueMode.PlayNow); //hacemos que pueda hacer movimiento aunque no tenga pelota
	yield WaitForSeconds(waitTime);
	//var pos = transform.TransformPoint(punchPosition);
	
	if (hasBall) {
		//in OnBallCaught() of PrisonRules.js: SetController(...)	    	
		// tirar pelota segun orientacion del jugador
		//print("keyThrowPower = " + keyThrowPower);
		var power = Mathf.Clamp(basePower + inputPower, minPower, maxPower); //print("final power = " + power);
		var direction = gameObject.transform.forward + baseDirection + Vector3(aimH, aimV, 0); //orientation of player + base direction + aim
		//test: power = basePower; direction.y = maxY_direction; //direction = LoseAim(direction, power);
		ThrowBall(power, direction);
	}

	yield WaitForSeconds(throwTime - waitTime);
	busy = false;
}*/

//maybe quit "try" in throw. but remain it in TryCatch
function TryThrowBall(inputDirection: Vector3, inputPower: float) { //power is in the range [0..1], so convert to [min, max]
	
	busy = true;
	yield WaitForSeconds(waitTime);
	
	if (hasBall) {
		var power : float = Mathf.Lerp(minPower, maxPower, inputPower); //the power is in the range [0..1], so convert to [minPower..maxPower]
		power = Mathf.Clamp(basePower + power, minPower, maxPower); 
		print("input power = " + inputPower + ", final power = " + power);
		
		var direction = gameObject.transform.forward /*+ baseDirection*/ + inputDirection; //orientation of player + base direction + aim
		ThrowBall(power, direction);
		yield WaitForSeconds(2); //nothing after throw: to avoid catch the ball itself again
	}

	yield WaitForSeconds(throwTime - waitTime);
	busy = false;
}


function ChangePlayer(inputPower: float) { //Without ball (checked in PlayerController.js), auto switch control to other player
	var power : float = Mathf.Lerp(minPower, maxPower, inputPower); //the power is in the range [0..1], so convert to [minPower..maxPower]
	power = Mathf.Clamp(basePower + power, minPower, maxPower);
	
	if (power >= strongPower)
		s_PrisonRules.OnFarChangePlayer(playerID); //this script will call functions of PlayerSwitchControl.js
	else 
		s_PrisonRules.OnChangePlayer(playerID); //decide who is the nearest. don't care the power of throw, it will be always the same
}


function TryPassBall(inputPower: float) { //throw ball with the direction to aimed player, but an opponent could catch it before	
	print("TryPassBall from " + playerName);
	//TODO or not: if (keyThrowPower > umbral) FarPassBall() //to the other area of his partners
	//throw. nota: esto es solo tirar a jugador, PrisonRules, no ve esto, solo ve OnBallCaught()
}


function Update() {
	if (hasBall && jointsOk) //playerID != NOPLAYER)
		ball.transform.position = hand.TransformPoint(handBallPosition); // global position
}

function OnCollisionEnter(col : Collision) {
	//print("playerball collision enter");
	if ((col.collider.CompareTag("Ball")) ) {
		//SetTouched(true); //TODO mejorar: que si toca las mnanos no sea tocado.
		//GameObject.FindWithTag("PrisonRules").SendMessage("OnPersonTouched", GetPlayerID()); //avisa que fue tocado
		if ((!ball.GetComponent(BallControl).IsGrounded()) && !hasProtection && !hasBall) {
			SendMessage("GotHit");
			s_PrisonRules.OnPersonTouched(GetPlayerID());
		}
	} 
}

function OnDrawGizmosSelected() { //in scene view for debugging: draw sphere of radius to catch ball. 
	Gizmos.color = Color.red;
	Gizmos.DrawWireSphere(transform.TransformPoint(handPosition), catchRadius); 
}



@script RequireComponent(PlayerMoveController);
